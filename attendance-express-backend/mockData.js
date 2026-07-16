const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Clearing existing test data...');
  // Delete all attendance logs and students to have a clean slate
  await prisma.attendanceLog.deleteMany({});
  await prisma.student.deleteMany({});
  console.log('Test data cleared.');

  console.log('Inserting mock students...');
  const students = [
    { student_id: 'STU-101', full_name: 'John Doe' },
    { student_id: 'STU-102', full_name: 'Jane Smith' },
    { student_id: 'STU-103', full_name: 'Alice Johnson' },
    { student_id: 'STU-104', full_name: 'Bob Brown' },
    { student_id: 'STU-105', full_name: 'Charlie Davis' },
  ];

  for (const s of students) {
    await prisma.student.create({
      data: {
        student_id: s.student_id,
        full_name: s.full_name
      }
    });
  }
  console.log('Mock students inserted.');

  console.log('Inserting mock attendance logs for today...');
  const today = new Date();
  
  // Helper to create date relative to now
  const createDate = (hoursOffset) => {
    const d = new Date();
    d.setHours(d.getHours() + hoursOffset);
    return d;
  };

  const logs = [
    // STU-101 is currently INSIDE (entered 3 hours ago)
    {
      student_id: 'STU-101',
      student_name: 'John Doe',
      camera_id: 1,
      similarity_score: 0.95,
      direction: 'IN',
      timestamp: createDate(-3),
      is_late: false,
    },
    // STU-102 is currently OUTSIDE (entered 4 hours ago, exited 2 hours ago)
    {
      student_id: 'STU-102',
      student_name: 'Jane Smith',
      camera_id: 1,
      similarity_score: 0.92,
      direction: 'IN',
      timestamp: createDate(-4),
      is_late: false,
    },
    {
      student_id: 'STU-102',
      student_name: 'Jane Smith',
      camera_id: 2,
      similarity_score: 0.88,
      direction: 'OUT',
      timestamp: createDate(-2),
      is_late: false,
    },
    // STU-103 is currently INSIDE AND LATE (entered 10 minutes ago, marked late)
    {
      student_id: 'STU-103',
      student_name: 'Alice Johnson',
      camera_id: null,
      similarity_score: 1.0,
      direction: 'IN',
      timestamp: createDate(-0.16), // ~10 mins ago
      is_late: true,
      reason: 'Missed curfew due to late bus',
    },
    // STU-104 has NO logs, so they are OUTSIDE
    
    // STU-105 is currently INSIDE (entered 5 hours ago)
    {
      student_id: 'STU-105',
      student_name: 'Charlie Davis',
      camera_id: 1,
      similarity_score: 0.96,
      direction: 'IN',
      timestamp: createDate(-5),
      is_late: false,
    }
  ];

  for (const log of logs) {
    await prisma.attendanceLog.create({
      data: log
    });
  }
  
  console.log('Mock attendance logs inserted.');
  
  console.log('Done! Current state should be:');
  console.log('- Total Enrolled: 5');
  console.log('- Currently Inside: 3 (John, Alice, Charlie)');
  console.log('- Currently Outside: 2 (Jane, Bob)');
  console.log('- Late Entries: 1 (Alice)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
