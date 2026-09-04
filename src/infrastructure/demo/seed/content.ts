import type {
  Announcement,
  ExamQuestion,
  HomeworkTask,
  QnaPost,
  Quiz,
  Resource,
  ScenarioCase,
  UserRole,
} from '@/domain';

export function seedScenarios(): ScenarioCase[] {
  return [
    {
      id: 'scenario-chat-bullying',
      title: '팀 단체채팅에서의 조롱',
      description:
        '경기에서 실수한 동료를 팀 단체채팅방에서 여러 선수가 조롱하고 있습니다. 나도 재미로 이모티콘을 보냈지만, 해당 선수는 이후 채팅방에 들어오지 않습니다.',
      audience: '학생선수',
      relatedValue: 'courage',
      relatedCourseIds: ['course-athlete-1'],
      choices: [
        {
          id: 'c1',
          label: '장난이므로 그냥 둔다.',
          impactOnSelf: '나도 조롱 문화에 동참한 사람이 됩니다.',
          impactOnPeer: '동료는 더 외롭고 위축될 수 있습니다.',
          impactOnTeam: '채팅방이 불편한 공간이 되고, 팀 결속이 약해집니다.',
          betterAction: '조롱을 멈추고 동료를 보호하는 말을 합니다.',
          usableSentence: '장난이어도 상처 줄 수 있어. 여기서는 그런 농담 하지 말자.',
          isRecommended: false,
        },
        {
          id: 'c2',
          label: '해당 선수에게만 개인 메시지를 보낸다.',
          impactOnSelf: '나만 위로했다고 생각할 수 있습니다.',
          impactOnPeer: '일시적 위로는 될 수 있지만, 공개적 조롱은 계속됩니다.',
          impactOnTeam: '문제의 원인인 단체 조롱 문화는 바뀌지 않습니다.',
          betterAction: '단체 채팅에서 조롱을 멈추자고 말합니다.',
          usableSentence: '혼자 위로하는 것도 좋지만, 팀 채팅에서 멈추는 게 더 중요해.',
          isRecommended: false,
        },
        {
          id: 'c3',
          label: '조롱을 멈추자고 말하고 필요한 경우 지도자나 담당자에게 도움을 요청한다.',
          impactOnSelf: '용기 있는 선택을 연습합니다.',
          impactOnPeer: '동료는 혼자가 아니라는 신호를 받습니다.',
          impactOnTeam: '존중하는 팀 문화를 회복하는 계기가 됩니다.',
          betterAction: '침묵하지 않고 팀 기준을 분명히 합니다.',
          usableSentence: '여기서는 서로 조롱하지 않기로 하자. 계속되면 코치님께 말할게.',
          isRecommended: true,
        },
        {
          id: 'c4',
          label: '채팅 내용을 다른 SNS에 공유한다.',
          impactOnSelf: '문제 해결이 아니라 확산에 동참합니다.',
          impactOnPeer: '동료의 수치심과 피해가 커질 수 있습니다.',
          impactOnTeam: '신뢰가 깨지고 갈등이 커집니다.',
          betterAction: '공유하지 않고 팀 안에서 해결하거나 도움을 요청합니다.',
          usableSentence: '이건 밖으로 옮기면 더 아파져. 팀 안에서 해결하자.',
          isRecommended: false,
        },
      ],
    },
    {
      id: 'scenario-generic-1',
      title: '경기 중 감정 조절',
      description: '심판 판정에 불만을 느꼈습니다. 벤치와 관중석의 시선이 느껴집니다.',
      audience: '학생선수',
      relatedValue: 'respect',
      relatedCourseIds: ['course-athlete-4'],
      choices: [
        {
          id: 'g1',
          label: '큰 소리로 항의한다.',
          impactOnSelf: '감정을 표현했지만 통제력을 잃을 수 있습니다.',
          impactOnPeer: '팀 분위기가 긴장합니다.',
          impactOnTeam: '경기 집중력이 떨어집니다.',
          betterAction: '심판에게 존중하는 방식으로 질문합니다.',
          usableSentence: '판정 기준을 다시 확인하고 싶습니다.',
          isRecommended: false,
        },
        {
          id: 'g2',
          label: '코치와 함께 존중하는 방식으로 확인한다.',
          impactOnSelf: '감정을 다루는 방법을 연습합니다.',
          impactOnPeer: '팀이 차분함을 유지합니다.',
          impactOnTeam: '경기력에 집중할 수 있습니다.',
          betterAction: '감정을 인정하고 행동은 존중으로 선택합니다.',
          usableSentence: '화가 나지만, 존중하는 방식으로 확인하겠습니다.',
          isRecommended: true,
        },
      ],
    },
    ...Array.from({ length: 10 }, (_, i) => ({
      id: `scenario-extra-${i + 1}`,
      title: `상황 ${i + 1}`,
      description: `팀과 경기장에서 마주하는 상황 ${i + 1}`,
      audience: '학생선수',
      relatedValue: 'fairness' as const,
      relatedCourseIds: [`course-athlete-${(i % 9) + 1}`],
      choices: [
        {
          id: `se${i}-1`,
          label: '그냥 넘어간다',
          impactOnSelf: '기회를 놓칩니다',
          impactOnPeer: '동료가 혼자 남습니다',
          impactOnTeam: '문화가 약해집니다',
          betterAction: '존중하는 선택을 합니다',
          usableSentence: '함께 해결해 보자',
          isRecommended: false,
        },
        {
          id: `se${i}-2`,
          label: '더 나은 선택을 한다',
          impactOnSelf: '성장합니다',
          impactOnPeer: '동료가 안심합니다',
          impactOnTeam: '팀 문화가 강해집니다',
          betterAction: '용기 있는 행동을 합니다',
          usableSentence: '우리 팀은 서로를 존중해',
          isRecommended: true,
        },
      ],
    })),
  ];
}

export function seedQuizzes(): Quiz[] {
  const baseQuestions = Array.from({ length: 20 }, (_, i) => ({
    id: `q-${i + 1}`,
    prompt: `FAIR PLAY 확인문항 ${i + 1}: 더 나은 선택은 무엇일까요?`,
    options: [
      { id: `q${i + 1}-a`, label: '침묵한다', isCorrect: false },
      { id: `q${i + 1}-b`, label: '존중하며 행동한다', isCorrect: true },
      { id: `q${i + 1}-c`, label: '비난한다', isCorrect: false },
    ],
    explanation: '존중과 책임 있는 행동이 팀 문화를 만듭니다.',
  }));

  return [
    {
      id: 'quiz-fairplay-basics',
      title: 'FAIR PLAY 기본 확인',
      passingScore: 60,
      questions: baseQuestions.slice(0, 5),
    },
    {
      id: 'quiz-extended',
      title: '확장 확인문항',
      passingScore: 60,
      questions: baseQuestions,
    },
  ];
}

export function seedAnnouncements(): Announcement[] {
  const roles: UserRole[] = ['athlete', 'guardian', 'coach', 'org_manager'];
  return [
    {
      id: 'ann-1',
      title: 'FAIR PLAY ACADEMY 오픈',
      body: '온라인 스포츠 가치교육 플랫폼이 시작되었습니다.\n\n학생선수, 학부모, 지도자, 기관 구성원 모두 역할에 맞는 교육과정을 수강할 수 있습니다. 교육과정 메뉴에서 대상별 과정을 확인해 주세요.',
      publishedAt: '2026-03-01T00:00:00.000Z',
      targetRoles: roles,
      authorName: '관리자',
      viewCount: 312,
      isPinned: true,
    },
    {
      id: 'ann-2',
      title: '보호자 동의 기능 안내',
      body: '만 14세 미만 학생선수는 보호자 동의 후 학습을 시작할 수 있습니다.\n\n보호자 계정으로 로그인하여 자녀 연결 및 동의 절차를 진행해 주세요. 동의 완료 후 학습 진도가 정상적으로 저장됩니다.',
      publishedAt: '2026-03-05T00:00:00.000Z',
      targetRoles: ['guardian', 'athlete'],
      authorName: '관리자',
      viewCount: 189,
      isPinned: true,
    },
    {
      id: 'ann-3',
      title: '기관교육 배정 안내',
      body: '기관관리자는 과정 배정과 진도 확인을 할 수 있습니다.\n\n기관관리자 계정으로 로그인 후 구성원·팀·과정 배정 메뉴에서 교육을 배정하고, 진도 및 수료 현황을 확인할 수 있습니다.',
      publishedAt: '2026-03-10T00:00:00.000Z',
      targetRoles: ['org_manager'],
      authorName: '관리자',
      viewCount: 97,
      isPinned: false,
    },
    {
      id: 'ann-4',
      title: '수료증 안내',
      body: '과정을 완료하면 수료증을 확인할 수 있습니다.\n\n과정별 수료 조건(차시 완료, 확인문항, 실천약속 등)을 충족하면 마이페이지에서 수료증을 다운로드할 수 있습니다.',
      publishedAt: '2026-03-15T00:00:00.000Z',
      targetRoles: roles,
      authorName: '관리자',
      viewCount: 156,
      isPinned: false,
    },
    {
      id: 'ann-5',
      title: '2026년 1학기 교육 일정 안내',
      body: '2026년 1학기 기관 배정 교육은 3월 1일부터 6월 30일까지 진행됩니다.\n\n기한 내 수료를 권장하며, 미수료 시 기관 관리자에게 별도 안내가 발송될 수 있습니다.',
      publishedAt: '2026-03-20T00:00:00.000Z',
      targetRoles: roles,
      authorName: '관리자',
      viewCount: 84,
      isPinned: false,
    },
  ];
}

export function seedQnaPosts(): QnaPost[] {
  return [
    {
      id: 'qna-1',
      title: '기관 단위 도입 절차가 궁금합니다',
      body: '학교 체육부에서 FAIR PLAY ACADEMY를 도입하려고 합니다. 계약 및 구성원 등록 절차를 알려주세요.',
      authorName: '김*진',
      createdAt: '2026-03-08T09:12:00.000Z',
      viewCount: 45,
      status: 'answered',
      answer:
        '기관 도입은 고객센터 또는 도입 문의 페이지를 통해 상담 신청 후 진행됩니다. 기관관리자 계정 발급, 구성원 일괄 등록, 과정 배정 순으로 설정하실 수 있습니다.',
      answeredAt: '2026-03-09T10:30:00.000Z',
    },
    {
      id: 'qna-2',
      title: '수료증 발급 조건을 확인하고 싶습니다',
      body: '모든 차시를 완료하면 수료증이 발급되나요? 확인문항 점수 기준이 있는지 궁금합니다.',
      authorName: '이*수',
      createdAt: '2026-03-12T14:20:00.000Z',
      viewCount: 67,
      status: 'answered',
      answer:
        '과정별로 수료 조건이 다릅니다. 일반적으로 필수 차시 100% 완료, 확인문항 통과(60점 이상), 실천약속 작성이 포함됩니다. 과정 상세 페이지에서 수료 조건을 확인할 수 있습니다.',
      answeredAt: '2026-03-13T09:00:00.000Z',
    },
    {
      id: 'qna-3',
      title: '모바일에서도 학습할 수 있나요?',
      body: '스마트폰으로도 차시 학습과 확인문항 응시가 가능한지 문의드립니다.',
      authorName: '박*영',
      createdAt: '2026-03-18T11:05:00.000Z',
      viewCount: 38,
      status: 'answered',
      answer: '네, 모바일 브라우저에서도 학습이 가능합니다. 영상 재생과 확인문항, 실천약속 작성을 모두 지원합니다.',
      answeredAt: '2026-03-18T15:40:00.000Z',
    },
    {
      id: 'qna-4',
      title: '보호자 계정과 자녀 계정 연결 방법',
      body: '자녀 선수 계정을 보호자 계정에 연결하는 방법을 알려주세요.',
      authorName: '최*희',
      createdAt: '2026-03-22T16:48:00.000Z',
      viewCount: 29,
      status: 'pending',
    },
    {
      id: 'qna-5',
      title: '진도율이 갱신되지 않습니다',
      body: '차시를 완료했는데 대시보드 진도율이 변하지 않습니다. 어떻게 해야 하나요?',
      authorName: '정*민',
      createdAt: '2026-03-25T08:33:00.000Z',
      viewCount: 12,
      status: 'pending',
    },
  ];
}

export function seedResources(): Resource[] {
  const roles: UserRole[] = ['athlete', 'guardian', 'coach'];
  return [
    { id: 'res-1', title: '가정 대화 가이드', description: '승리보다 중요한 부모의 언어', category: '대화', targetRoles: ['guardian'] },
    { id: 'res-2', title: '팀 미팅 가이드', description: '존중하는 팀 문화 만들기', category: '지도', targetRoles: ['coach'] },
    { id: 'res-3', title: '정서 조절 연습카드', description: '감정을 이기는 선수', category: '학습', targetRoles: ['athlete'] },
    { id: 'res-4', title: '인권•안전 자료', description: '안전한 팀 만들기', category: '안전', targetRoles: roles },
    { id: 'res-5', title: '진로•학업 안내', description: '삶을 함께 준비', category: '진로', targetRoles: ['guardian', 'athlete'] },
    { id: 'res-6', title: 'FAIR PLAY 가치 포스터', description: '공정•존중•책임•공존•용기', category: '홍보', targetRoles: roles },
  ];
}

function mcq(
  id: string,
  courseId: string,
  prompt: string,
  options: [string, string, string, string],
  correctIndex: number,
  points: number,
  order: number,
): ExamQuestion {
  return {
    id,
    courseId,
    prompt,
    options: options.map((label, i) => ({
      id: `${id}-opt-${i + 1}`,
      label,
      isCorrect: i === correctIndex,
    })),
    points,
    order,
    createdAt: '2026-03-01T00:00:00.000Z',
  };
}

/** 과정별 시험 기출 은행 (객관식) */
export function seedExamQuestions(): ExamQuestion[] {
  const athlete1 = [
    mcq('eq-a1-1', 'course-athlete-1', '페어플레이의 핵심 가치에 포함되지 않는 것은?', ['공정', '존중', '승리 지상주의', '용기'], 2, 10, 1),
    mcq('eq-a1-2', 'course-athlete-1', '팀 단체채팅에서 동료를 조롱하는 상황에서 더 나은 선택은?', ['침묵한다', '조롱을 멈추자고 말한다', '다른 SNS에 공유한다', '같은 농담을 한다'], 1, 15, 2),
    mcq('eq-a1-3', 'course-athlete-1', '챔피언의 품격에서 강조하는 태도는?', ['상대를 무시한다', '규칙과 상대를 존중한다', '판정에 무조건 항의한다', '혼자만 잘하면 된다'], 1, 10, 3),
    mcq('eq-a1-4', 'course-athlete-1', '경기 중 판정에 불만이 있을 때 바람직한 행동은?', ['큰 소리로 항의한다', '존중하는 방식으로 확인한다', '상대를 비난한다', '경기를 포기한다'], 1, 15, 4),
    mcq('eq-a1-5', 'course-athlete-1', '실천약속의 목적은?', ['성적 증명', '일상에서 더 나은 선택을 이어가기', '처벌 기록', '관중 동원'], 1, 10, 5),
    mcq('eq-a1-6', 'course-athlete-1', '팀 문화를 좋게 만드는 데 가장 중요한 것은?', ['개인 기록만 챙기기', '서로를 존중하는 말과 행동', '실수 숨기기', '외부 비난'], 1, 15, 6),
    mcq('eq-a1-7', 'course-athlete-1', '온라인에서도 선수의 태도가 중요한 이유는?', ['조회수 때문', '말과 행동이 동료에게 영향을 주기 때문', '광고 때문', '순위 때문'], 1, 10, 7),
    mcq('eq-a1-8', 'course-athlete-1', '동료가 실수했을 때 페어플레이 선수의 태도는?', ['조롱한다', '격려하고 함께 회복한다', '무시한다', 'SNS에 올린다'], 1, 15, 8),
    mcq('eq-a1-9', 'course-athlete-1', '확인문항을 푸는 이유로 가장 적절한 것은?', ['시간 채우기', '학습 내용을 점검하기', '처벌 피하기', '점수만 올리기'], 1, 10, 9),
    mcq('eq-a1-10', 'course-athlete-1', 'FAIR PLAY ACADEMY가 강조하는 교육 방식은?', ['암기 위주', '상황 속에서 선택을 연습하기', '이론만 듣기', '경쟁만 강조'], 1, 10, 10),
  ];

  const guardian1 = [
    mcq('eq-g1-1', 'course-guardian-1', '학부모로서 선수의 성장을 돕는 언어는?', ['결과만 따진다', '노력과 태도를 인정한다', '다른 아이와만 비교한다', '감정적으로 비난한다'], 1, 15, 1),
    mcq('eq-g1-2', 'course-guardian-1', '학생선수 이해의 출발점은?', ['성적표만 보기', '선수의 상황과 감정을 이해하려 하기', '코치에게만 맡기기', '경기 결과만 확인'], 1, 15, 2),
    mcq('eq-g1-3', 'course-guardian-1', '가정의 언어가 중요한 이유는?', ['학교 성적 때문', '선수의 기준과 자신감에 영향을 주기 때문', 'SNS 홍보 때문', '장학금 때문'], 1, 20, 3),
    mcq('eq-g1-4', 'course-guardian-1', '패배 후 바람직한 대화는?', ['왜 졌냐고만 묻는다', '과정과 배움을 함께 이야기한다', '화를 낸다', '대화를 피한다'], 1, 15, 4),
    mcq('eq-g1-5', 'course-guardian-1', '성장 지원에서 학부모의 역할은?', ['모든 결정을 대신하기', '존중과 지지로 함께하기', '훈련만 강요하기', '결과 압박하기'], 1, 20, 5),
    mcq('eq-g1-6', 'course-guardian-1', '진로·학업을 함께 준비하는 태도는?', ['선수 생활만 강조', '장기적 삶을 함께 설계', '학업 포기 요구', '관심 없음'], 1, 15, 6),
  ];

  const coach1 = [
    mcq('eq-c1-1', 'course-coach-1', '존중으로 지도하는 지도자의 말은?', ['모욕으로 동기부여', '존중하는 피드백', '공개 비난', '침묵만'], 1, 15, 1),
    mcq('eq-c1-2', 'course-coach-1', '팀 문화를 만드는 주된 요인은?', ['시설', '지도자의 말과 선택', '유니폼 색', '관중 수'], 1, 20, 2),
    mcq('eq-c1-3', 'course-coach-1', '선수가 실수했을 때 바람직한 지도는?', ['공개 조롱', '교정과 격려를 함께', '무시', '즉시 퇴출'], 1, 15, 3),
    mcq('eq-c1-4', 'course-coach-1', '공정한 선발의 기준은?', ['사적 친분', '명확한 기준과 설명', '부모 압력', '즉흥적 기분'], 1, 20, 4),
    mcq('eq-c1-5', 'course-coach-1', '안전한 팀을 위해 지도자가 해야 할 일은?', ['문제 외면', '존중·안전 기준을 분명히 하기', '선수끼리만 해결 요구', 'SNS 확산'], 1, 15, 5),
    mcq('eq-c1-6', 'course-coach-1', '선수의 목소리를 듣는 이유는?', ['형식상', '존중과 신뢰를 키우기 위해', '시간 낭비', '성적과 무관'], 1, 15, 6),
  ];

  return [...athlete1, ...guardian1, ...coach1];
}

export function seedHomeworkTasks(): HomeworkTask[] {
  const now = '2026-03-01T00:00:00.000Z';
  return [
    {
      id: 'hw-task-athlete-1',
      courseId: 'course-athlete-1',
      title: '페어플레이 실천 보고서',
      prompt:
        '최근 팀·경기·온라인에서 마주한 상황을 하나 골라, (1) 어떤 선택이 있었는지 (2) 내가 선택한 행동 (3) 더 나은 페어플레이 행동은 무엇이었는지 작성하세요. 분량은 자유롭게 하되, 구체적 사례를 포함해 주세요.',
      maxScore: 100,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'hw-task-guardian-1',
      courseId: 'course-guardian-1',
      title: '가정 대화 실천 기록',
      prompt:
        '자녀(학생선수)와 나눈 대화 중 성장·태도를 지지한 사례를 적어 주세요. 사용한 말과 그 후 자녀의 반응, 앞으로 바꾸고 싶은 언어 습관을 함께 정리해 주세요.',
      maxScore: 100,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'hw-task-coach-1',
      courseId: 'course-coach-1',
      title: '존중 지도 실천 계획',
      prompt:
        '이번 주 훈련/경기에서 적용할 존중 지도 행동을 3가지 적어 주세요. 각 행동이 팀 문화에 어떤 영향을 줄지, 선수에게 전달할 문장 예시를 함께 작성하세요.',
      maxScore: 100,
      createdAt: now,
      updatedAt: now,
    },
  ];
}
