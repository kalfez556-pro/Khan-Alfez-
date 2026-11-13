import { UserProfile, Assignment, Submission, StudyNote, QuizQuestion, StorePerk, AttendanceRecord, ClassroomGroup, AppNotification, ClassNotice } from '../types';

export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'fac-1',
    name: 'Prof. Arvind Sharma',
    role: 'faculty',
    division: 'A',
    department: 'Computer Science & Engineering',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    title: 'HOD & Professor (Algorithms & Compilers)',
    email: 'arvind.sharma@engg.edu',
    attendancePercent: 96,
    gems: 1200,
    streakDays: 45,
    hasStreakFreeze: true,
    activeBadges: ['Faculty Mentor', 'Lab Director']
  },
  {
    id: 'fac-2',
    name: 'Dr. Meera Nambiar',
    role: 'faculty',
    division: 'B',
    department: 'Computer Science & Engineering',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    title: 'Associate Professor (Operating Systems & Networks)',
    email: 'meera.nambiar@engg.edu',
    attendancePercent: 98,
    gems: 980,
    streakDays: 32,
    hasStreakFreeze: true,
    activeBadges: ['OS Specialist', 'Research Lead']
  },
  {
    id: 'stu-1',
    name: 'Rahul Sharma',
    role: 'student',
    division: 'A',
    rollNumber: 'CS2024-042',
    parentPhone: '+91 98201 44510',
    department: 'Computer Science & Engineering',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80',
    title: 'B.Tech CSE - 3rd Year (Div A)',
    email: 'rahul.s@student.engg.edu',
    attendancePercent: 84.5,
    gems: 260,
    streakDays: 6,
    hasStreakFreeze: true,
    activeBadges: ['DSA Warrior', 'Streak Master']
  },
  {
    id: 'stu-2',
    name: 'Priya Patel',
    role: 'student',
    division: 'B',
    rollNumber: 'CS2024-089',
    parentPhone: '+91 98112 77340',
    department: 'Computer Science & Engineering',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    title: 'B.Tech CSE - 3rd Year (Div B)',
    email: 'priya.p@student.engg.edu',
    attendancePercent: 92.0,
    gems: 340,
    streakDays: 14,
    hasStreakFreeze: true,
    activeBadges: ['Database Ace', 'Top Scorer']
  }
];

export const INITIAL_ATTENDANCE_LOGS: AttendanceRecord[] = [
  {
    id: 'att-101',
    sessionId: 'sess-a-01',
    studentId: 'stu-1',
    studentName: 'Rahul Sharma',
    studentDivision: 'A',
    targetDivision: 'A',
    courseCode: 'CS301',
    timestamp: 'Today, 09:12 AM',
    status: 'valid',
    ipHash: '172.28.x.x',
    deviceFingerprint: 'SM-G998B (Android 14)'
  },
  {
    id: 'att-102',
    sessionId: 'sess-a-01',
    studentId: 'stu-x',
    studentName: 'Aman Verma',
    studentDivision: 'A',
    targetDivision: 'A',
    courseCode: 'CS301',
    timestamp: 'Today, 09:14 AM',
    status: 'valid',
    ipHash: '172.28.x.x',
    deviceFingerprint: 'iPhone 15,3 (iOS 17.5)'
  },
  {
    id: 'att-103',
    sessionId: 'sess-a-01',
    studentId: 'stu-proxy',
    studentName: 'Vikram Joshi (Div B trying Div A session)',
    studentDivision: 'B',
    targetDivision: 'A',
    courseCode: 'CS301',
    timestamp: 'Today, 09:16 AM',
    status: 'proxy_rejected',
    rejectionReason: 'ANTI-PROXY BLOCK: Student belongs to Division B, session locked to Division A.',
    ipHash: '192.168.x.x (Off-Campus VPN)',
    deviceFingerprint: 'Pixel 8 Pro'
  }
];

export const INITIAL_ASSIGNMENTS: Assignment[] = [
  {
    id: 'assign-1',
    title: 'Lab 4: LR(1) Parser & Syntax Tree Generation',
    courseCode: 'CS302',
    courseName: 'Compiler Design',
    division: 'A',
    facultyId: 'fac-1',
    facultyName: 'Prof. Arvind Sharma',
    deadline: 'In 3 Days (Friday 11:59 PM)',
    totalMarks: 30,
    instructions: 'Implement canonical LR(1) collection item generation, construct the ACTION and GOTO tables, and report AST generation runtime on standard arithmetic grammar inputs.',
    deliverables: ['LR1_Parser.cpp or parser.py', 'Comprehensive Lab Report (.pdf)', 'Benchmark Execution Graphs'],
    submissionCount: 41,
    totalStudents: 60
  },
  {
    id: 'assign-2',
    title: 'Lab 5: Multithreaded Matrix Multiplication & Memory Cache Misses',
    courseCode: 'CS304',
    courseName: 'Operating Systems',
    division: 'ALL',
    facultyId: 'fac-2',
    facultyName: 'Dr. Meera Nambiar',
    deadline: 'In 6 Days (Next Monday 05:00 PM)',
    totalMarks: 25,
    instructions: 'Design POSIX pthread worker pools to perform tiled NxN matrix multiplication. Benchmark L1/L2 cache misses using perf or Valgrind cachegrind.',
    deliverables: ['matrix_pthread.c', 'Valgrind Cache Profiling Report (.pdf)', 'Speedup Comparison Chart'],
    submissionCount: 54,
    totalStudents: 120
  },
  {
    id: 'assign-3',
    title: 'Lab 3: B+ Tree Node Splitting & WAL Crash Recovery Simulation',
    courseCode: 'CS305',
    courseName: 'Database Management Systems',
    division: 'B',
    facultyId: 'fac-2',
    facultyName: 'Dr. Meera Nambiar',
    deadline: 'In 1 Day (Tomorrow 11:59 PM)',
    totalMarks: 30,
    instructions: 'Simulate Write-Ahead Logging (WAL) and B+ tree index operations under simulated system failure. Verify ARIES redo-undo phases.',
    deliverables: ['bplus_wal_engine.rs / .py', 'Crash Recovery Verification PDF'],
    submissionCount: 38,
    totalStudents: 60
  }
];

export const INITIAL_SUBMISSIONS: Submission[] = [
  {
    id: 'sub-1',
    assignmentId: 'assign-1',
    studentId: 'stu-1',
    studentName: 'Rahul Sharma',
    studentDivision: 'A',
    fileName: 'RahulSharma_CS2024_042_LR1_Report.pdf',
    fileSize: '3.4 MB',
    submittedAt: 'Yesterday, 10:45 PM',
    benchmarkStats: {
      executionTimeMs: 14.8,
      memoryKb: 3420,
      testCasesPassed: 18,
      totalTestCases: 18
    },
    codeSnippet: `// LR(1) Item Set Generator
void computeLR1Closure(StateSet& I, const Grammar& G) {
    bool changed = true;
    while(changed) {
        changed = false;
        for (const auto& item : I.items) {
            if (item.dotPos < item.production.rhs.size()) {
                Symbol B = item.production.rhs[item.dotPos];
                if (G.isNonTerminal(B)) {
                    // Compute FIRST(beta + a)
                    std::vector<Symbol> beta(item.production.rhs.begin() + item.dotPos + 1, item.production.rhs.end());
                    auto lookaheads = G.computeFirstWithLookahead(beta, item.lookahead);
                    for (const auto& prod : G.getProductionsFor(B)) {
                        for (const auto& la : lookaheads) {
                            if (I.insertItem({prod, 0, la})) changed = true;
                        }
                    }
                }
            }
        }
    }
}`,
    status: 'graded',
    obtainedMarks: 29,
    facultyFeedback: 'Outstanding implementation of the LR(1) closure and canonical item sets. Clean memory profile and crisp benchmarks. Full credit on AST parser grammar tests.',
    gradedBy: 'Prof. Arvind Sharma',
    gradedAt: 'Today, 08:30 AM'
  },
  {
    id: 'sub-2',
    assignmentId: 'assign-2',
    studentId: 'stu-1',
    studentName: 'Rahul Sharma',
    studentDivision: 'A',
    fileName: 'RahulSharma_Pthread_Cache_Perf.pdf',
    fileSize: '4.8 MB',
    submittedAt: 'Today, 02:15 PM',
    benchmarkStats: {
      executionTimeMs: 42.1,
      memoryKb: 12400,
      testCasesPassed: 10,
      totalTestCases: 10
    },
    codeSnippet: `void* tiled_worker(void* arg) {
    ThreadConfig* cfg = (ThreadConfig*)arg;
    for (int i = cfg->row_start; i < cfg->row_end; i += TILE_SIZE) {
        for (int k = 0; k < MATRIX_N; k += TILE_SIZE) {
            for (int j = 0; j < MATRIX_N; j += TILE_SIZE) {
                // Micro-kernel with SIMD vectorization hints
                for (int ii = i; ii < min(i + TILE_SIZE, cfg->row_end); ++ii) {
                    for (int kk = k; kk < min(k + TILE_SIZE, MATRIX_N); ++kk) {
                        for (int jj = j; jj < min(j + TILE_SIZE, MATRIX_N); ++jj) {
                            C[ii][jj] += A[ii][kk] * B[kk][jj];
                        }
                    }
                }
            }
        }
    }
    pthread_exit(NULL);
}`,
    status: 'pending'
  },
  {
    id: 'sub-3',
    assignmentId: 'assign-3',
    studentId: 'stu-2',
    studentName: 'Priya Patel',
    studentDivision: 'B',
    fileName: 'PriyaPatel_BPlus_WAL_CrashRecovery.pdf',
    fileSize: '5.1 MB',
    submittedAt: 'Yesterday, 11:10 PM',
    benchmarkStats: {
      executionTimeMs: 28.4,
      memoryKb: 8900,
      testCasesPassed: 20,
      totalTestCases: 20
    },
    codeSnippet: `def aries_crash_recovery(wal_log, dirty_page_table, txn_table):
    # Phase 1: Analysis Pass
    scan_point = get_last_checkpoint_lsn()
    print(f"[ARIES] Analysis phase starting from LSN {scan_point}")
    # Phase 2: Redo Pass (Repeat history)
    # Phase 3: Undo Pass (Rollback uncommitted transactions)`,
    status: 'graded',
    obtainedMarks: 30,
    facultyFeedback: 'Flawless verification of the ARIES recovery algorithm. Clear explanation of compensative log records (CLRs) and B+ tree node rebalancing.',
    gradedBy: 'Dr. Meera Nambiar',
    gradedAt: 'Today, 11:20 AM'
  }
];

export const INITIAL_STUDY_NOTES: StudyNote[] = [
  {
    id: 'note-1',
    title: 'Advanced Self-Balancing Trees & Amortized Analysis',
    subject: 'Data Structures & Algorithms',
    chapter: 'Module 3: Balanced Search Trees',
    division: 'ALL',
    author: 'Prof. Arvind Sharma',
    authorRole: 'Course Faculty',
    dateAdded: '2026-11-02',
    pages: 18,
    fileSize: '4.2 MB',
    summary: 'Exhaustive reference covering Red-Black Tree invariants, AVL rotations, Splay Tree amortized potential function, and B-Tree disk I/O reduction.',
    keyTopics: ['Red-Black Violations & Rotations', 'Amortized Credit Method', 'Splay Tree Access Lemma', 'External Sorting with B-Trees'],
    samplePagesContent: [
      {
        pageNumber: 1,
        title: '1. Red-Black Tree Structural Properties',
        content: `A Red-Black tree is a binary search tree that satisfies the following four invariants:
1. Every node is either Red or Black.
2. The root is always Black.
3. Every external leaf (NIL) is Black.
4. If a node is Red, then both its children are Black (no two consecutive red nodes on any path).
5. For each node, all simple paths from the node to descendant leaves contain the exact same number of Black nodes (known as Black-Height bh(x)).

Theorem (Height Bound): A Red-Black tree with n internal nodes has height h <= 2 * log2(n + 1).
Proof: By induction on the subtree rooted at x, any subtree contains at least 2^(bh(x)) - 1 internal nodes. Since at least half the nodes on any path from root to leaf are black, bh(root) >= h/2. Thus n >= 2^(h/2) - 1, which directly yields h <= 2 * log2(n + 1).`,
        equations: ['h <= 2 * log2(n + 1)', 'bh(root) >= height / 2', 'T(insert) = O(log n) with <= 2 rotations']
      },
      {
        pageNumber: 2,
        title: '2. Insertion Cases & Fixup State Machine',
        content: `When inserting a new key z into tree T:
1. Perform ordinary BST insertion and color z RED.
2. If z is the root, color z BLACK and terminate.
3. If z's parent (p) is BLACK, no violation occurs; terminate.
4. If z's parent (p) is RED, violation of Property 4 occurs! Let u be z's uncle (sibling of p).

Case 1: Uncle u is RED (Color Flip)
- Repaint parent p and uncle u BLACK.
- Repaint grandparent g RED.
- Recurse fixup upward with z = g.

Case 2: Uncle u is BLACK & z is an inner child (Triangle / Zig-Zag)
- Perform left/right rotation on parent p to transform into Line case.

Case 3: Uncle u is BLACK & z is an outer child (Line / Zig-Zig)
- Repaint parent p BLACK, grandparent g RED.
- Rotate grandparent g toward uncle side. Tree is now fully balanced.`,
        diagramLabel: 'Red-Black Rotation & Recoloring Flowchart'
      },
      {
        pageNumber: 3,
        title: '3. Amortized Complexity Analysis (Potential Method)',
        content: `The potential method defines a potential function Phi(D_i) mapping data structure state D_i to a real number R.
The amortized cost a_i of the i-th operation with actual cost c_i is:
a_i = c_i + Phi(D_i) - Phi(D_{i-1}) = c_i + Delta Phi_i.

For Splay Trees, let r(x) = log2(size(x)). Define Phi(T) = Sum(r(x)) over all x in T.
The Access Lemma guarantees that splaying node x to root takes amortized cost:
a_i <= 3 * (r(root) - r(x)) + 1 = O(log n).
This proves the fundamental property: even though an individual BST search can cost O(n), any sequence of m operations takes strictly O(m log n) time.`
      }
    ]
  },
  {
    id: 'note-2',
    title: 'Virtual Memory, TLB Hierarchy & Page Fault Handling',
    subject: 'Operating Systems',
    chapter: 'Module 4: Memory Management',
    division: 'ALL',
    author: 'Dr. Meera Nambiar',
    authorRole: 'Associate Professor',
    dateAdded: '2026-11-04',
    pages: 24,
    fileSize: '5.6 MB',
    summary: 'Hardware MMU page table walk, inverted page tables, multi-level paging for x86-64, TLB shootdown in multicore SMP, and Second-Chance clock page replacement.',
    keyTopics: ['4-Level Paging (PML4, PDPT, PD, PT)', 'TLB Hit/Miss Hardware Sequencer', 'Dirty Bit Eviction & Swap Daemon', 'Belady’s Anomaly & Working Set Model'],
    samplePagesContent: [
      {
        pageNumber: 1,
        title: '1. x86-64 4-Level Paging Architecture',
        content: `In standard x86-64 long mode, virtual addresses are 48 bits sign-extended to 64 bits:
- Bits 47:39 -> PML4 (Page Map Level 4) Index (9 bits, 512 entries)
- Bits 38:30 -> PDPT (Page Directory Pointer Table) Index (9 bits)
- Bits 29:21 -> PD (Page Directory) Index (9 bits)
- Bits 20:12 -> PT (Page Table) Index (9 bits)
- Bits 11:0  -> Physical Page Offset (12 bits = 4 KB page frame)

CR3 Control Register holds the physical base address of the PML4 table.
When the CPU executes a memory load or instruction fetch, the hardware Memory Management Unit (MMU) automatically performs this 4-step traversal unless intercepted by a Translation Lookaside Buffer (TLB) hit.`,
        equations: ['Virtual Address: 9 + 9 + 9 + 9 + 12 = 48 bits', 'Page Size = 2^12 = 4096 bytes (4 KB)', 'EAT = (1 - p) * t_mem + p * t_swap']
      },
      {
        pageNumber: 2,
        title: '2. Page Replacement: Clock & Second-Chance',
        content: `Because true LRU requires costly timestamp stamping or hardware counters on every memory reference, modern operating systems implement approximation algorithms:

Clock Algorithm Mechanics:
- Pages in physical memory are arranged in a circular buffer with a clock hand pointing to the next victim candidate.
- Each page frame descriptor maintains a Reference Bit (R-bit) and a Modified/Dirty Bit (M-bit).
- On hardware memory access, MMU sets R = 1.
- When memory pressure triggers page eviction:
  1. If R == 1: clear R = 0, advance clock hand. The page gets a "second chance".
  2. If R == 0 and M == 0: clean page frame! Evict immediately without disk write.
  3. If R == 0 and M == 1: schedule background write to swap partition, clear M, advance hand.`
      }
    ]
  },
  {
    id: 'note-3',
    title: 'ACID Transactions, Multi-Version Concurrency (MVCC) & WAL',
    subject: 'Database Management Systems',
    chapter: 'Module 5: Concurrency & Recovery',
    division: 'ALL',
    author: 'Dr. Meera Nambiar',
    authorRole: 'Associate Professor',
    dateAdded: '2026-10-28',
    pages: 22,
    fileSize: '3.8 MB',
    summary: 'Deep dive into Conflict Serializability, 2-Phase Locking (Rigorous 2PL), Postgres/MySQL MVCC snapshot isolation, and ARIES recovery protocol.',
    keyTopics: ['Conflict Serializability Graph (DAG)', 'Snapshot Isolation Anomalies (Write Skew)', 'Write-Ahead Logging (WAL) Protocol', 'ARIES Checkpoint & Fuzzy Dumping'],
    samplePagesContent: [
      {
        pageNumber: 1,
        title: '1. Serializability & Dependency Graphs',
        content: `Two operations in a schedule S conflict if:
1. They belong to different transactions T_i and T_j.
2. They access the exact same data item Q.
3. At least one of the operations is a write(Q).

Conflict Serializability Theorem:
A schedule S is conflict serializable if and only if its precedence graph (serialization graph) has NO directed cycles.
- Node: Each committed transaction T_i.
- Edge: T_i -> T_j if an operation in T_i conflicts with and precedes an operation in T_j.
If topological sort produces an ordering, S is equivalent to that serial execution.`,
        equations: ['Conflict if (T_i != T_j) and (Item(x) == Item(y)) and (isWrite(x) or isWrite(y))']
      }
    ]
  }
];

export const INITIAL_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q-dsa-1',
    subject: 'DSA',
    difficulty: 'Easy',
    question: 'What is the maximum number of rotations required to restore Red-Black tree properties after an insertion?',
    options: ['At most 1 rotation', 'At most 2 rotations', 'At most 3 rotations', 'O(log n) rotations'],
    correctAnswer: 1,
    explanation: 'Insertion into a Red-Black tree requires at most 2 rotations (Case 2 followed by Case 3), although recoloring may propagate up to O(log n) levels.',
    points: 10
  },
  {
    id: 'q-dsa-2',
    subject: 'DSA',
    difficulty: 'Medium',
    question: 'In a Fibonacci Heap, what is the amortized time complexity of the Decrease-Key operation?',
    options: ['O(log n)', 'O(1)', 'O(n)', 'O(sqrt(n))'],
    correctAnswer: 1,
    explanation: 'Using cascading cuts and potential function Phi = t(H) + 2*m(H), Decrease-Key achieves O(1) amortized time.',
    points: 15
  },
  {
    id: 'q-dsa-3',
    subject: 'DSA',
    difficulty: 'Hard',
    question: 'Which algorithmic paradigm solves the Maximum Flow problem in O(V^2 * E) time complexity?',
    options: ['Ford-Fulkerson with DFS', 'Edmonds-Karp BFS', 'Dinic’s Blocking Flow Algorithm', 'Push-Relabel with FIFO'],
    correctAnswer: 2,
    explanation: 'Dinic’s algorithm builds level graphs using BFS and pushes blocking flows with DFS, yielding O(V^2 * E) for general capacity networks.',
    points: 25
  },
  {
    id: 'q-os-1',
    subject: 'OS',
    difficulty: 'Easy',
    question: 'Which CPU scheduling algorithm can suffer from the "Convoy Effect"?',
    options: ['Round Robin (RR)', 'First-Come, First-Served (FCFS)', 'Shortest Remaining Time First (SRTF)', 'Multi-level Feedback Queue (MLFQ)'],
    correctAnswer: 1,
    explanation: 'In FCFS, when a long CPU-bound process holds the CPU, short I/O-bound processes back up in the ready queue, creating the Convoy Effect.',
    points: 10
  },
  {
    id: 'q-os-2',
    subject: 'OS',
    difficulty: 'Medium',
    question: 'Why does Belady’s Anomaly occur in the FIFO page replacement algorithm?',
    options: [
      'FIFO does not satisfy the Stack Property (subset inclusion)',
      'Page frames are allocated dynamically',
      'The TLB cache is bypassed on page fault',
      'Dirty pages require double disk writes'
    ],
    correctAnswer: 0,
    explanation: 'Stack algorithms guarantee that the set of pages in an m-frame memory is always a strict subset of that in an (m+1)-frame memory. FIFO violates this property.',
    points: 15
  },
  {
    id: 'q-dbms-1',
    subject: 'DBMS',
    difficulty: 'Easy',
    question: 'What does the "I" in ACID stand for, and what concurrency anomaly does it guard against?',
    options: [
      'Indexed: Guards against slow full-table scans',
      'Isolation: Guards against concurrent race conditions and dirty reads',
      'Idempotency: Guards against duplicate transaction execution',
      'Integrity: Guards against foreign key constraint violations'
    ],
    correctAnswer: 1,
    explanation: 'Isolation ensures that concurrent transactions execute as if they were running serially without interfering with each other.',
    points: 10
  },
  {
    id: 'q-dbms-2',
    subject: 'DBMS',
    difficulty: 'Medium',
    question: 'In Write-Ahead Logging (WAL), what condition MUST hold before a dirty page is flushed from buffer pool to disk?',
    options: [
      'The entire transaction must have executed commit',
      'The corresponding log record up to the pageLSN must be flushed to disk first (WAL protocol)',
      'All other active transactions must yield their lock handles',
      'The database index must be recomputed'
    ],
    correctAnswer: 1,
    explanation: 'The fundamental WAL protocol dictates: logLSN >= pageLSN must be written to stable storage before the dirty page frame itself touches disk.',
    points: 15
  },
  {
    id: 'q-net-1',
    subject: 'Networks',
    difficulty: 'Medium',
    question: 'During TCP Reno Congestion Control, what happens upon detecting triple duplicate ACKs?',
    options: [
      'Congestion window drops to 1 MSS and enters Slow Start',
      'Congestion window is halved, sshthresh is set to cwnd, and enters Fast Recovery',
      'TCP sends RST packet and closes the socket',
      'Window size remains unchanged and keeps transmitting'
    ],
    correctAnswer: 1,
    explanation: 'Triple duplicate ACK signals packet loss without network collapse; Reno halves cwnd (Fast Retransmit) and increments by 1 MSS for each additional dup ACK (Fast Recovery).',
    points: 15
  }
];

// 15 Questions for Weekly Mega Test
export const WEEKLY_MEGA_TEST_QUESTIONS: QuizQuestion[] = [
  ...INITIAL_QUIZ_QUESTIONS,
  {
    id: 'mega-1',
    subject: 'DSA',
    difficulty: 'Medium',
    question: 'What is the tightest worst-case time complexity of finding the Median in an unsorted array of n elements?',
    options: ['O(n log n)', 'O(n) using Median of Medians', 'O(n^2)', 'O(log n)'],
    correctAnswer: 1,
    explanation: 'Blum-Floyd-Pratt-Rivest-Tarjan Median-of-Medians algorithm guarantees O(n) worst-case time by picking guaranteed 30-70 pivots.',
    points: 20
  },
  {
    id: 'mega-2',
    subject: 'OS',
    difficulty: 'Hard',
    question: 'What is the purpose of the "Translation Lookaside Buffer (TLB) Shootdown" in multiprocessor kernels?',
    options: [
      'To power down idle CPU cores',
      'To synchronize invalid page table entries across all CPU caches via Inter-Processor Interrupts (IPI)',
      'To prevent disk write buffer overruns',
      'To schedule real-time threads ahead of user space'
    ],
    correctAnswer: 1,
    explanation: 'When one CPU modifies a page mapping (e.g. mprotect or munmap), all other CPUs caching that translation in their local TLBs must be interrupted via IPI to invalidate the stale entry.',
    points: 25
  },
  {
    id: 'mega-3',
    subject: 'DBMS',
    difficulty: 'Hard',
    question: 'Under Snapshot Isolation, which concurrency anomaly can still occur even though Dirty Reads, Non-Repeatable Reads, and Phantoms are prevented?',
    options: ['Lost Update', 'Write Skew Anomaly', 'Dirty Write', 'Cascading Rollback'],
    correctAnswer: 1,
    explanation: 'Write Skew occurs when two concurrent transactions read overlapping data sets but write to disjoint records, violating a global cross-record integrity constraint.',
    points: 25
  },
  {
    id: 'mega-4',
    subject: 'Networks',
    difficulty: 'Medium',
    question: 'What prevents routing loops in the Border Gateway Protocol (BGP)?',
    options: ['Split Horizon rule', 'AS-Path attribute inspection', 'Poison Reverse', 'Hop Count limit of 15'],
    correctAnswer: 1,
    explanation: 'BGP is a path-vector protocol; if a router receives an advertisement containing its own Autonomous System (AS) number in the AS_PATH list, it immediately rejects the route.',
    points: 20
  },
  {
    id: 'mega-5',
    subject: 'DSA',
    difficulty: 'Hard',
    question: 'In Aho-Corasick string matching automaton, what do the failure transitions represent?',
    options: [
      'Shortest common supersequence',
      'Longest proper suffix of the current prefix that is also a prefix of some pattern in the dictionary',
      'Hamming distance threshold',
      'Hash table collision bucket'
    ],
    correctAnswer: 1,
    explanation: 'Failure links jump to the node representing the longest proper suffix that exists in the trie, enabling O(text_length + matches) linear scanning.',
    points: 25
  },
  {
    id: 'mega-6',
    subject: 'OS',
    difficulty: 'Medium',
    question: 'Which system call mechanism prevents priority inversion in real-time operating systems?',
    options: ['Priority Inheritance Protocol', 'Round Robin quantum reduction', 'Kernel spinlocks', 'Voluntary sleep polling'],
    correctAnswer: 0,
    explanation: 'Priority Inheritance temporarily elevates the priority of a low-priority thread holding a lock to match the highest-priority thread waiting on that lock.',
    points: 20
  },
  {
    id: 'mega-7',
    subject: 'DBMS',
    difficulty: 'Medium',
    question: 'What is the fanout of a B+ Tree if page size is 8 KB, key size is 16 bytes, and child pointer size is 8 bytes?',
    options: ['~64 keys', '~341 pointers', '~1024 keys', '~256 pointers'],
    correctAnswer: 1,
    explanation: 'Formula: P * 8 + (P - 1) * 16 <= 8192 => 24*P - 16 <= 8192 => 24*P <= 8208 => P <= 342. High fanout keeps B+ tree depth to <= 3-4 levels.',
    points: 20
  }
];

export const INITIAL_STORE_PERKS: StorePerk[] = [
  {
    id: 'perk-freeze',
    title: 'Streak Freeze Shield',
    description: 'Protects your daily learning streak for 24 hours if you miss a day due to exams or illness.',
    gemCost: 50,
    iconName: 'ShieldCheck',
    category: 'study',
    available: true,
    perkEffect: '1-Day Streak Immunity'
  },
  {
    id: 'perk-priority-feedback',
    title: 'Priority Lab Evaluation',
    description: 'Moves your next Lab Assignment submission to the priority grading queue with comprehensive faculty feedback.',
    gemCost: 80,
    iconName: 'Zap',
    category: 'study',
    available: true,
    perkEffect: '24h Faculty Review Guarantee'
  },
  {
    id: 'perk-late-slip',
    title: '24h Grace Extension Pass',
    description: 'Grants an automatic 24-hour extension on any upcoming lab report without late submission penalty.',
    gemCost: 100,
    iconName: 'ClockAlert',
    category: 'study',
    available: true,
    perkEffect: '+24h Deadline Buffer'
  },
  {
    id: 'perk-badge-algo',
    title: 'Algorithm Ace Gold Badge',
    description: 'Displays a prestigious animated gold badge on your profile header, leaderboards, and code submissions.',
    gemCost: 120,
    iconName: 'Award',
    category: 'cosmetic',
    available: true,
    perkEffect: 'Profile Badge Showcase'
  },
  {
    id: 'perk-badge-titan',
    title: 'Binary Titan Title & Aura',
    description: 'Grants a luminous cyan glow border on your student card and attendance confirmation checkmarks.',
    gemCost: 150,
    iconName: 'Sparkles',
    category: 'cosmetic',
    available: true,
    perkEffect: 'Neon Card Aesthetic'
  }
];

export const MOCK_STUDENT_ANALYTICS = [
  { day: 'Mon', score: 85, gems: 20, studyHours: 3.5 },
  { day: 'Tue', score: 92, gems: 35, studyHours: 4.2 },
  { day: 'Wed', score: 78, gems: 15, studyHours: 2.8 },
  { day: 'Thu', score: 95, gems: 45, studyHours: 5.1 },
  { day: 'Fri', score: 88, gems: 30, studyHours: 3.9 },
  { day: 'Sat', score: 96, gems: 55, studyHours: 6.0 },
  { day: 'Sun', score: 90, gems: 60, studyHours: 4.5 }
];

export const MOCK_DIVISION_ATTENDANCE_COMPARISON = [
  { course: 'Compiler Design', divA: 87, divB: 83 },
  { course: 'Operating Systems', divA: 82, divB: 91 },
  { course: 'DBMS', divA: 89, divB: 88 },
  { course: 'Comp Networks', divA: 79, divB: 85 },
  { course: 'Theory of Computation', divA: 84, divB: 78 }
];

export const INITIAL_CLASSROOM_GROUPS: ClassroomGroup[] = [
  {
    id: 'grp-cd-101',
    courseCode: 'CS302',
    courseName: 'Compiler Design & AST Lab',
    division: 'A',
    facultyId: 'fac-1',
    facultyName: 'Prof. Arvind Sharma',
    facultyAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    groupPassword: 'ALGO#2024',
    inviteCode: 'CD-A101',
    inviteLink: 'https://studyphantom.edu/join?code=CD-A101',
    enrolledStudentIds: ['stu-1'],
    createdAt: '2026-10-15',
    description: 'Canonical LR(1) parsers, AST trees, intermediate code representations, and register allocation.'
  },
  {
    id: 'grp-os-202',
    courseCode: 'CS304',
    courseName: 'Operating Systems & Multiprocessing',
    division: 'B',
    facultyId: 'fac-2',
    facultyName: 'Dr. Meera Nambiar',
    facultyAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    groupPassword: 'KERN#8890',
    inviteCode: 'OS-B202',
    inviteLink: 'https://studyphantom.edu/join?code=OS-B202',
    enrolledStudentIds: ['stu-2'],
    createdAt: '2026-10-18',
    description: 'POSIX pthreads, virtual memory paging, cachegrind profiling, and IPC mechanisms.'
  },
  {
    id: 'grp-db-303',
    courseCode: 'CS305',
    courseName: 'Database Systems & ARIES Recovery',
    division: 'B',
    facultyId: 'fac-2',
    facultyName: 'Dr. Meera Nambiar',
    facultyAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    groupPassword: 'DB#SQL55',
    inviteCode: 'DB-B303',
    inviteLink: 'https://studyphantom.edu/join?code=DB-B303',
    enrolledStudentIds: ['stu-2'],
    createdAt: '2026-10-20',
    description: 'B+ Tree indexing, ARIES recovery protocols, Write-Ahead Logging (WAL), and MVCC concurrency.'
  }
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-deadline-1',
    type: 'deadline_reminder',
    title: '⏳ 24-Hour Deadline Alert: Lab 3 Report Due Tomorrow!',
    message: 'Submission deadline for "Lab 3: B+ Tree Node Splitting & WAL Crash Recovery" is in less than 24 hours (Tomorrow 11:59 PM). Submit your report now to avoid late cutoff penalties!',
    facultyId: 'fac-2',
    facultyName: 'Dr. Meera Nambiar',
    facultyAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    targetDivision: 'ALL',
    courseCode: 'CS305',
    createdAt: '10m ago',
    timestamp: Date.now() - 10 * 60 * 1000,
    readByStudentIds: [],
    linkTab: 'assignments',
    itemId: 'assign-3',
    isUrgent: true,
    hoursRemaining: 24
  },
  {
    id: 'notif-1',
    type: 'assignment',
    title: 'New Lab Assignment: LR(1) Parser & AST',
    message: 'Prof. Arvind Sharma published Lab 4 for CS302 Compiler Design (Div A). Total Marks: 30. Deadline: Friday 11:59 PM.',
    facultyId: 'fac-1',
    facultyName: 'Prof. Arvind Sharma',
    facultyAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    targetDivision: 'A',
    courseCode: 'CS302',
    createdAt: '15m ago',
    timestamp: Date.now() - 15 * 60 * 1000,
    readByStudentIds: [],
    linkTab: 'assignments',
    itemId: 'assign-1',
    isUrgent: false
  },
  {
    id: 'notif-2',
    type: 'note',
    title: 'New Official Notes: Balanced Search Trees',
    message: 'Prof. Arvind Sharma uploaded 18-page comprehensive reference notes covering Red-Black Tree invariants & Amortized Potential Method.',
    facultyId: 'fac-1',
    facultyName: 'Prof. Arvind Sharma',
    facultyAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    targetDivision: 'ALL',
    courseCode: 'CS302',
    createdAt: '1 hour ago',
    timestamp: Date.now() - 60 * 60 * 1000,
    readByStudentIds: [],
    linkTab: 'notes',
    itemId: 'note-1',
    isUrgent: false
  },
  {
    id: 'notif-3',
    type: 'notice',
    title: 'Urgent Lab 304 Evaluation Notice',
    message: 'Dr. Meera Nambiar announced: Multithreaded Matrix multiplication benchmarks will be verified live on Linux terminals today.',
    facultyId: 'fac-2',
    facultyName: 'Dr. Meera Nambiar',
    facultyAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    targetDivision: 'ALL',
    courseCode: 'CS304',
    createdAt: '2 hours ago',
    timestamp: Date.now() - 120 * 60 * 1000,
    readByStudentIds: ['stu-1'],
    linkTab: 'groups',
    isUrgent: true
  }
];

export const INITIAL_NOTICES: ClassNotice[] = [
  {
    id: 'notice-1',
    facultyId: 'fac-1',
    facultyName: 'Prof. Arvind Sharma',
    facultyAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    title: 'LR(1) Parser Code Review & AST Execution Guidelines',
    content: 'All Division A students are advised to check memory leaks in AST construction using Valgrind before submitting Lab 4. Benchmark graphs must be included in your PDF.',
    division: 'A',
    courseCode: 'CS302',
    createdAt: 'Today, 09:30 AM',
    isUrgent: false
  },
  {
    id: 'notice-2',
    facultyId: 'fac-2',
    facultyName: 'Dr. Meera Nambiar',
    facultyAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    title: 'Urgent: Operating Systems Lab Benchmark Verification',
    content: 'Bring your laptop or lab credentials. We will inspect pthread cache miss counters on perf tool during session hours.',
    division: 'ALL',
    courseCode: 'CS304',
    createdAt: 'Today, 08:45 AM',
    isUrgent: true
  }
];
