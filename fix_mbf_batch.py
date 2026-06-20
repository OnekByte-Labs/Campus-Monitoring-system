import onnx

def fix_onnx_batch_size(input_path, output_path):
    print(f"Loading ONNX model from {input_path}...")
    try:
        model = onnx.load(input_path)
    except Exception as e:
        print(f"Failed to load ONNX model: {e}")
        return

    print("Updating input dimensions to dynamic batch size...")
    # Change input batch dimension to dynamic
    for input_node in model.graph.input:
        dim = input_node.type.tensor_type.shape.dim[0]
        dim.dim_param = "batch_size"

    print("Updating output dimensions to dynamic batch size...")
    # Change output batch dimension to dynamic
    for output_node in model.graph.output:
        dim = output_node.type.tensor_type.shape.dim[0]
        dim.dim_param = "batch_size"

    print(f"Saving dynamic batch ONNX model to {output_path}...")
    try:
        onnx.save(model, output_path)
        print("Success! You can now use batch-size=8 or 16 in sgie_config.txt.")
    except Exception as e:
        print(f"Failed to save ONNX model: {e}")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Fix ONNX batch size for DeepStream.")
    parser.add_argument("--input", default="models/w600k_mbf.onnx", help="Path to input ONNX file")
    parser.add_argument("--output", default="models/w600k_mbf_dynamic.onnx", help="Path to output ONNX file")
    args = parser.parse_args()
    
    fix_onnx_batch_size(args.input, args.output)
