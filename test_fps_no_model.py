import gi
import sys
import os
import math
import time
gi.require_version('Gst', '1.0')
from gi.repository import Gst, GLib
import pyds

fps_streams = {}

def osd_sink_pad_buffer_probe(pad, info, u_data):
    gst_buffer = info.get_buffer()
    if not gst_buffer:
        return Gst.PadProbeReturn.OK

    batch_meta = pyds.gst_buffer_get_nvds_batch_meta(hash(gst_buffer))
    l_frame = batch_meta.frame_meta_list

    while l_frame is not None:
        try:
            frame_meta = pyds.NvDsFrameMeta.cast(l_frame.data)
        except StopIteration:
            break

        source_id = frame_meta.source_id
        now = time.time()

        if source_id not in fps_streams:
            fps_streams[source_id] = {'last_time': now, 'frame_count': 0, 'fps': 0.0}
            
        fps_streams[source_id]['frame_count'] += 1
        elapsed = now - fps_streams[source_id]['last_time']
        
        if elapsed >= 1.0:
            fps_streams[source_id]['fps'] = (fps_streams[source_id]['frame_count'] / elapsed)
            fps_streams[source_id]['frame_count'] = 0
            fps_streams[source_id]['last_time'] = now
            print(f"[cam {source_id}] Raw Camera FPS: {fps_streams[source_id]['fps']:.1f}")

        current_fps = fps_streams[source_id]['fps']

        # Draw FPS on screen
        display_meta = pyds.nvds_acquire_display_meta_from_pool(batch_meta)
        display_meta.num_labels = 1
        py_nvosd_text_params = display_meta.text_params[0]
        py_nvosd_text_params.display_text = f"RAW FPS: {current_fps:.1f}"
        py_nvosd_text_params.x_offset = 10
        py_nvosd_text_params.y_offset = 12
        py_nvosd_text_params.font_params.font_name = "Serif"
        py_nvosd_text_params.font_params.font_size = 14
        py_nvosd_text_params.font_params.font_color.set(0.0, 1.0, 0.0, 1.0)
        py_nvosd_text_params.set_bg_clr = 1
        py_nvosd_text_params.text_bg_clr.set(0.0, 0.0, 0.0, 0.7)
        pyds.nvds_add_display_meta_to_frame(frame_meta, display_meta)

        try:
            l_frame = l_frame.next
        except StopIteration:
            break

    return Gst.PadProbeReturn.OK

def cb_newpad(decodebin, decoder_src_pad, data):
    caps = decoder_src_pad.get_current_caps()
    gststruct = caps.get_structure(0)
    gstname = gststruct.get_name()
    source_bin = data
    features = caps.get_features(0)

    if gstname.find("video") != -1:
        if features.contains("memory:NVMM"):
            bin_ghost_pad = source_bin.get_static_pad("src")
            if not bin_ghost_pad.set_target(decoder_src_pad):
                print("Failed to link decoder src pad to source bin ghost pad")
        else:
            print("Error: Decodebin did not pick nvidia decoder plugin.")

def create_source_bin(index, uri):
    bin_name = f"source-bin-{index}"
    nbin = Gst.Bin.new(bin_name)

    if uri.startswith(("rtsp://", "http://", "https://", "file://")):
        uri_decode_bin = Gst.ElementFactory.make("uridecodebin", "uri-decode-bin")
        uri_decode_bin.set_property("uri", uri)
        uri_decode_bin.connect("pad-added", cb_newpad, nbin)
        uri_decode_bin.connect(
            "child-added",
            lambda child_proxy, obj, name, user_data:
                obj.set_property("drop-on-latency", True) if name.find("source") != -1 else None,
            nbin)
        Gst.Bin.add(nbin, uri_decode_bin)
    else:
        v4l2src = Gst.ElementFactory.make("v4l2src", f"v4l2src_{index}")
        v4l2src.set_property("device", uri)
        nvvidconv = Gst.ElementFactory.make("nvvideoconvert", f"nvvidconv_{index}")
        capsfilter = Gst.ElementFactory.make("capsfilter", f"caps_{index}")
        caps = Gst.Caps.from_string("video/x-raw(memory:NVMM), width=640, height=480, format=NV12, framerate=30/1")
        capsfilter.set_property("caps", caps)

        Gst.Bin.add(nbin, v4l2src)
        Gst.Bin.add(nbin, nvvidconv)
        Gst.Bin.add(nbin, capsfilter)
        v4l2src.link(nvvidconv)
        nvvidconv.link(capsfilter)

    bin_pad = nbin.add_pad(Gst.GhostPad.new_no_target("src", Gst.PadDirection.SRC))
    if not uri.startswith(("rtsp://", "http://", "https://", "file://")):
        nbin.get_static_pad("src").set_target(capsfilter.get_static_pad("src"))

    return nbin

def main(args):
    if len(args) < 2:
        print("Usage: python3 test_fps_no_model.py <cam_uri> [cam2_uri ...]")
        sys.exit(1)

    sources = args[1:]
    num_sources = len(sources)

    Gst.init(None)
    pipeline = Gst.Pipeline()

    streammux = Gst.ElementFactory.make("nvstreammux", "Stream-muxer")
    streammux.set_property('width', 640)
    streammux.set_property('height', 480)
    streammux.set_property('batch-size', num_sources)
    streammux.set_property('live-source', 1)
    streammux.set_property('batched-push-timeout', 40000)
    streammux.set_property('nvbuf-memory-type', 0)
    pipeline.add(streammux)

    for i in range(num_sources):
        source_bin = create_source_bin(i, sources[i])
        pipeline.add(source_bin)
        padname = f"sink_{i}"
        sinkpad = streammux.get_request_pad(padname)
        srcpad = source_bin.get_static_pad("src")
        srcpad.link(sinkpad)

    tiler = Gst.ElementFactory.make("nvmultistreamtiler", "nvtiler")
    tiler_rows = int(math.sqrt(num_sources))
    tiler_columns = int(math.ceil(float(num_sources) / tiler_rows))
    tiler.set_property("rows", tiler_rows)
    tiler.set_property("columns", tiler_columns)
    tiler.set_property("width", 1280)
    tiler.set_property("height", 720)

    nvvidconv = Gst.ElementFactory.make("nvvideoconvert", "convertor")
    nvosd = Gst.ElementFactory.make("nvdsosd", "onscreendisplay")
    transform = Gst.ElementFactory.make("nvegltransform", "nvegl-transform")
    sink = Gst.ElementFactory.make("nveglglessink", "nvvideo-renderer")
    sink.set_property('sync', False)
    sink.set_property('qos', False)

    for elem in [tiler, nvvidconv, nvosd, sink]:
        pipeline.add(elem)
    if transform:
        pipeline.add(transform)

    # Link everything bypassing models
    streammux.link(tiler)
    tiler.link(nvvidconv)
    nvvidconv.link(nvosd)

    if transform:
        nvosd.link(transform)
        transform.link(sink)
    else:
        nvosd.link(sink)

    # Add probe to measure FPS
    osd_sink_pad = nvosd.get_static_pad("sink")
    if osd_sink_pad:
        osd_sink_pad.add_probe(Gst.PadProbeType.BUFFER, osd_sink_pad_buffer_probe, 0)

    loop = GLib.MainLoop()
    bus = pipeline.get_bus()
    bus.add_signal_watch()

    def bus_call(bus, message, loop):
        t = message.type
        if t == Gst.MessageType.EOS:
            loop.quit()
        elif t == Gst.MessageType.ERROR:
            err, debug = message.parse_error()
            print(f"[ERROR] {err}")
            loop.quit()
        return True

    bus.connect("message", bus_call, loop)

    print("\nStarting pipeline WITHOUT models... Press Ctrl+C to stop")
    pipeline.set_state(Gst.State.PLAYING)

    try:
        loop.run()
    except KeyboardInterrupt:
        print("\nInterrupted by user")

    pipeline.set_state(Gst.State.NULL)

if __name__ == '__main__':
    sys.exit(main(sys.argv))
