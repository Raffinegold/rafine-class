import type {
  CashWallet,
  CodingWrongNote,
  RedemptionRequest,
  ShopItem,
  Student,
  Word,
  WordSet,
  Level,
} from '../types';

/**
 * 데모 시드 데이터
 * - 학생 5명 (라피네코딩 두정점 재원생 예시)
 * - Level 1~5 각 20단어 = 총 100단어 (교육부 기본 어휘 성격의 단어를 자체 선정)
 * - 뜻·예문은 전부 자체 작성 (사전 문장 복제 없음)
 */

type Row = [word: string, meaning: string, pos: string, ipa: string, example: string, example_ko: string];

const L1: Row[] = [
  ['apple', '사과', 'n', '/ˈæpl/', 'I eat an apple after coding class.', '나는 코딩 수업이 끝나면 사과를 먹어요.'],
  ['book', '책', 'n', '/bʊk/', 'This book is about robots.', '이 책은 로봇에 관한 책이에요.'],
  ['cat', '고양이', 'n', '/kæt/', 'The cat sleeps on my keyboard.', '고양이가 내 키보드 위에서 자요.'],
  ['dog', '개', 'n', '/dɔːɡ/', 'My dog waits at the door.', '우리 개가 문 앞에서 기다려요.'],
  ['egg', '달걀', 'n', '/eɡ/', 'I boil an egg for breakfast.', '나는 아침에 달걀을 삶아요.'],
  ['fish', '물고기', 'n', '/fɪʃ/', 'The fish swims in the tank.', '물고기가 수조 안에서 헤엄쳐요.'],
  ['girl', '소녀', 'n', '/ɡɜːrl/', 'The girl draws a game map.', '그 소녀는 게임 지도를 그려요.'],
  ['hand', '손', 'n', '/hænd/', 'Raise your hand to answer.', '대답하려면 손을 들어요.'],
  ['ice', '얼음', 'n', '/aɪs/', 'Put some ice in the water.', '물에 얼음을 좀 넣어요.'],
  ['jump', '뛰다', 'v', '/dʒʌmp/', 'The rabbit can jump high.', '토끼는 높이 뛸 수 있어요.'],
  ['key', '열쇠', 'n', '/kiː/', 'I lost my classroom key.', '나는 교실 열쇠를 잃어버렸어요.'],
  ['milk', '우유', 'n', '/mɪlk/', 'Drink milk every morning.', '매일 아침 우유를 마셔요.'],
  ['nose', '코', 'n', '/noʊz/', 'The puppy has a wet nose.', '강아지의 코는 젖어 있어요.'],
  ['open', '열다', 'v', '/ˈoʊpən/', 'Open the window, please.', '창문을 열어 주세요.'],
  ['pencil', '연필', 'n', '/ˈpensl/', 'Write your name with a pencil.', '연필로 이름을 써요.'],
  ['rain', '비', 'n', '/reɪn/', 'The rain stops at noon.', '비가 정오에 그쳐요.'],
  ['sun', '해', 'n', '/sʌn/', 'The sun is bright today.', '오늘은 해가 밝아요.'],
  ['tree', '나무', 'n', '/triː/', 'A bird sits in the tree.', '새가 나무에 앉아 있어요.'],
  ['water', '물', 'n', '/ˈwɔːtər/', 'Please bring me some water.', '물 좀 가져다 주세요.'],
  ['yellow', '노란', 'adj', '/ˈjeloʊ/', 'She wears a yellow shirt.', '그녀는 노란 셔츠를 입어요.'],
];

const L2: Row[] = [
  ['animal', '동물', 'n', '/ˈænɪml/', 'The zoo has many animals.', '동물원에는 동물이 많아요.'],
  ['because', '왜냐하면', 'conj', '/bɪˈkɔːz/', 'I like coding because it is fun.', '코딩이 재미있어서 좋아해요.'],
  ['climb', '오르다', 'v', '/klaɪm/', 'We climb the hill on Saturdays.', '우리는 토요일마다 언덕에 올라요.'],
  ['country', '나라', 'n', '/ˈkʌntri/', 'Korea is my country.', '한국은 내 나라예요.'],
  ['dinner', '저녁 식사', 'n', '/ˈdɪnər/', 'We have dinner at seven.', '우리는 7시에 저녁을 먹어요.'],
  ['easy', '쉬운', 'adj', '/ˈiːzi/', 'This game is easy for beginners.', '이 게임은 초보자에게 쉬워요.'],
  ['family', '가족', 'n', '/ˈfæməli/', 'My family watches movies together.', '우리 가족은 함께 영화를 봐요.'],
  ['finish', '끝내다', 'v', '/ˈfɪnɪʃ/', 'Finish your homework first.', '숙제를 먼저 끝내요.'],
  ['garden', '정원', 'n', '/ˈɡɑːrdn/', 'Flowers grow in the garden.', '정원에서 꽃이 자라요.'],
  ['hungry', '배고픈', 'adj', '/ˈhʌŋɡri/', 'I am hungry after class.', '수업 후에 배가 고파요.'],
  ['invite', '초대하다', 'v', '/ɪnˈvaɪt/', 'I invite my friends to my birthday.', '생일에 친구들을 초대해요.'],
  ['kitchen', '부엌', 'n', '/ˈkɪtʃɪn/', 'Mom is cooking in the kitchen.', '엄마가 부엌에서 요리해요.'],
  ['library', '도서관', 'n', '/ˈlaɪbreri/', 'I read books in the library.', '도서관에서 책을 읽어요.'],
  ['morning', '아침', 'n', '/ˈmɔːrnɪŋ/', 'I stretch every morning.', '나는 매일 아침 기지개를 켜요.'],
  ['picture', '그림', 'n', '/ˈpɪktʃər/', 'Draw a picture of your robot.', '네 로봇 그림을 그려 봐요.'],
  ['question', '질문', 'n', '/ˈkwestʃən/', 'Ask a question if you are not sure.', '확실하지 않으면 질문하세요.'],
  ['remember', '기억하다', 'v', '/rɪˈmembər/', 'Remember to save your file.', '파일 저장하는 걸 기억해요.'],
  ['strong', '힘센', 'adj', '/strɔːŋ/', 'He is strong enough to carry it.', '그는 그것을 들 만큼 힘이 세요.'],
  ['together', '함께', 'adv', '/təˈɡeðər/', 'We study English together.', '우리는 함께 영어를 공부해요.'],
  ['weather', '날씨', 'n', '/ˈweðər/', 'The weather is cold today.', '오늘 날씨가 추워요.'],
];

const L3: Row[] = [
  ['borrow', '빌리다', 'v', '/ˈbɑːroʊ/', 'Can I borrow your charger?', '충전기를 빌려도 될까요?'],
  ['careful', '조심스러운', 'adj', '/ˈkerfl/', 'Be careful with the glass.', '유리잔을 조심히 다뤄요.'],
  ['decide', '결정하다', 'v', '/dɪˈsaɪd/', 'We decide the game topic today.', '우리는 오늘 게임 주제를 정해요.'],
  ['describe', '묘사하다', 'v', '/dɪˈskraɪb/', 'Describe your favorite place in English.', '좋아하는 장소를 영어로 묘사해 봐요.'],
  ['environment', '환경', 'n', '/ɪnˈvaɪrənmənt/', 'We should protect the environment.', '우리는 환경을 보호해야 해요.'],
  ['famous', '유명한', 'adj', '/ˈfeɪməs/', 'This academy is famous in Cheonan.', '이 학원은 천안에서 유명해요.'],
  ['honest', '정직한', 'adj', '/ˈɑːnɪst/', 'An honest answer is always better.', '정직한 대답이 항상 더 좋아요.'],
  ['instead', '대신에', 'adv', '/ɪnˈsted/', "Let's use a loop instead.", '대신 반복문을 써 봐요.'],
  ['introduce', '소개하다', 'v', '/ˌɪntrəˈduːs/', 'Introduce yourself to the new student.', '새 학생에게 자신을 소개해요.'],
  ['journey', '여행', 'n', '/ˈdʒɜːrni/', 'The journey to Seoul takes two hours.', '서울까지 가는 여정은 두 시간 걸려요.'],
  ['mistake', '실수', 'n', '/mɪˈsteɪk/', 'A mistake helps you learn.', '실수는 배움을 도와요.'],
  ['necessary', '필요한', 'adj', '/ˈnesəseri/', 'Water is necessary for life.', '물은 삶에 필요해요.'],
  ['opinion', '의견', 'n', '/əˈpɪnjən/', 'Share your opinion with the team.', '팀에게 네 의견을 나눠 봐요.'],
  ['possible', '가능한', 'adj', '/ˈpɑːsəbl/', 'Is it possible to finish today?', '오늘 끝내는 게 가능한가요?'],
  ['prepare', '준비하다', 'v', '/prɪˈper/', 'Prepare your presentation for Friday.', '금요일 발표를 준비하세요.'],
  ['protect', '보호하다', 'v', '/prəˈtekt/', 'Sunglasses protect your eyes.', '선글라스는 눈을 보호해요.'],
  ['reason', '이유', 'n', '/ˈriːzn/', 'Tell me the reason you chose it.', '그것을 고른 이유를 말해 봐요.'],
  ['suggest', '제안하다', 'v', '/səˈdʒest/', 'I suggest a simple design.', '간단한 디자인을 제안해요.'],
  ['trouble', '문제', 'n', '/ˈtrʌbl/', 'Tell the teacher if you have trouble.', '문제가 있으면 선생님께 말해요.'],
  ['volunteer', '자원봉사자', 'n', '/ˌvɑːlənˈtɪr/', 'She is a volunteer at the library.', '그녀는 도서관 자원봉사자예요.'],
];

const L4: Row[] = [
  ['achieve', '달성하다', 'v', '/əˈtʃiːv/', 'You can achieve your goal step by step.', '목표를 한 걸음씩 달성할 수 있어요.'],
  ['approach', '접근법', 'n', '/əˈproʊtʃ/', 'Try a different approach to the problem.', '문제에 다른 접근법을 시도해 봐요.'],
  ['benefit', '이익', 'n', '/ˈbenɪfɪt/', 'Daily review has a big benefit.', '매일 복습은 큰 이익이 있어요.'],
  ['compare', '비교하다', 'v', '/kəmˈper/', 'Compare the two results carefully.', '두 결과를 주의 깊게 비교하세요.'],
  ['consider', '고려하다', 'v', '/kənˈsɪdər/', 'Consider the user before coding.', '코딩 전에 사용자를 고려하세요.'],
  ['contribute', '기여하다', 'v', '/kənˈtrɪbjuːt/', 'Everyone can contribute one idea.', '누구나 아이디어 하나씩 기여할 수 있어요.'],
  ['decrease', '감소하다', 'v', '/dɪˈkriːs/', 'Errors decrease with practice.', '연습하면 오류가 감소해요.'],
  ['efficient', '효율적인', 'adj', '/ɪˈfɪʃnt/', 'This code is short and efficient.', '이 코드는 짧고 효율적이에요.'],
  ['encourage', '격려하다', 'v', '/ɪnˈkɜːrɪdʒ/', 'Teachers encourage students to ask.', '선생님은 학생들이 질문하도록 격려해요.'],
  ['establish', '설립하다', 'v', '/ɪˈstæblɪʃ/', 'They establish a new club.', '그들은 새 동아리를 설립해요.'],
  ['evidence', '증거', 'n', '/ˈevɪdəns/', 'Find evidence before you decide.', '결정하기 전에 증거를 찾아요.'],
  ['independent', '독립적인', 'adj', '/ˌɪndɪˈpendənt/', 'She is an independent learner.', '그녀는 독립적인 학습자예요.'],
  ['influence', '영향', 'n', '/ˈɪnfluəns/', 'Friends have a strong influence on us.', '친구는 우리에게 큰 영향을 줘요.'],
  ['maintain', '유지하다', 'v', '/meɪnˈteɪn/', 'Maintain a steady study routine.', '꾸준한 공부 습관을 유지하세요.'],
  ['opportunity', '기회', 'n', '/ˌɑːpərˈtuːnəti/', 'This contest is a good opportunity.', '이 대회는 좋은 기회예요.'],
  ['participate', '참여하다', 'v', '/pɑːrˈtɪsɪpeɪt/', 'All students participate in the demo day.', '모든 학생이 시연회에 참여해요.'],
  ['purpose', '목적', 'n', '/ˈpɜːrpəs/', 'What is the purpose of this app?', '이 앱의 목적은 무엇인가요?'],
  ['require', '요구하다', 'v', '/rɪˈkwaɪər/', 'This project requires teamwork.', '이 프로젝트는 협동을 요구해요.'],
  ['responsible', '책임 있는', 'adj', '/rɪˈspɑːnsəbl/', 'Be responsible for your own files.', '자기 파일에 책임을 지세요.'],
  ['significant', '중요한', 'adj', '/sɪɡˈnɪfɪkənt/', 'Small habits make a significant change.', '작은 습관이 중요한 변화를 만들어요.'],
];

const L5: Row[] = [
  ['accommodate', '수용하다', 'v', '/əˈkɑːmədeɪt/', 'The hall can accommodate 200 people.', '그 강당은 200명을 수용할 수 있어요.'],
  ['accurate', '정확한', 'adj', '/ˈækjərət/', 'Accurate data leads to a good decision.', '정확한 데이터가 좋은 결정으로 이어져요.'],
  ['anticipate', '예상하다', 'v', '/ænˈtɪsɪpeɪt/', 'We anticipate more users next month.', '우리는 다음 달 사용자가 더 많을 것으로 예상해요.'],
  ['coherent', '일관성 있는', 'adj', '/koʊˈhɪrənt/', 'Write a coherent paragraph.', '일관성 있는 문단을 쓰세요.'],
  ['consequence', '결과', 'n', '/ˈkɑːnsɪkwens/', 'Every choice has a consequence.', '모든 선택에는 결과가 따라요.'],
  ['controversial', '논란이 많은', 'adj', '/ˌkɑːntrəˈvɜːrʃl/', 'The rule was controversial at first.', '그 규칙은 처음에 논란이 많았어요.'],
  ['demonstrate', '입증하다', 'v', '/ˈdemənstreɪt/', 'The test demonstrates your progress.', '그 시험은 네 발전을 입증해요.'],
  ['deteriorate', '악화되다', 'v', '/dɪˈtɪriəreɪt/', 'Without practice, skills deteriorate.', '연습이 없으면 실력이 악화돼요.'],
  ['elaborate', '자세히 설명하다', 'v', '/ɪˈlæbəreɪt/', 'Could you elaborate on that idea?', '그 아이디어를 자세히 설명해 줄래요?'],
  ['inevitable', '불가피한', 'adj', '/ɪnˈevɪtəbl/', 'Some errors are inevitable at first.', '처음에는 어느 정도 오류가 불가피해요.'],
  ['interpret', '해석하다', 'v', '/ɪnˈtɜːrprət/', 'Interpret the graph in your own words.', '그래프를 네 말로 해석해 봐요.'],
  ['legitimate', '합법적인', 'adj', '/lɪˈdʒɪtɪmət/', 'Use legitimate sources for your report.', '보고서에는 합법적인 출처를 쓰세요.'],
  ['mitigate', '완화하다', 'v', '/ˈmɪtɪɡeɪt/', 'Good planning can mitigate the risk.', '좋은 계획은 위험을 완화할 수 있어요.'],
  ['notion', '개념', 'n', '/ˈnoʊʃn/', 'He questioned the notion of easy success.', '그는 쉬운 성공이라는 개념에 의문을 품었어요.'],
  ['perceive', '인식하다', 'v', '/pərˈsiːv/', 'People perceive colors differently.', '사람들은 색을 다르게 인식해요.'],
  ['persistent', '끈질긴', 'adj', '/pərˈsɪstənt/', 'A persistent student never gives up.', '끈질긴 학생은 포기하지 않아요.'],
  ['profound', '심오한', 'adj', '/prəˈfaʊnd/', 'The book had a profound effect on me.', '그 책은 나에게 심오한 영향을 주었어요.'],
  ['reluctant', '꺼리는', 'adj', '/rɪˈlʌktənt/', 'He was reluctant to speak first.', '그는 먼저 말하기를 꺼렸어요.'],
  ['sustain', '지속하다', 'v', '/səˈsteɪn/', 'Sustain your focus for ten minutes.', '십 분 동안 집중을 지속해 보세요.'],
  ['versatile', '다재다능한', 'adj', '/ˈvɜːrsətl/', 'Python is a versatile language.', '파이썬은 다재다능한 언어예요.'],
];

const LEVEL_ROWS: Record<Level, Row[]> = { 1: L1, 2: L2, 3: L3, 4: L4, 5: L5 };

export const SEED_STUDENTS: Student[] = [
  {
    id: 'stu-seoyeon',
    name: '김서연',
    class_name: '초등B',
    grade: 5,
    level: 3,
    tosel_level: 'Basic',
    pin: '1111',
    nickname: '별빛서연',
    parent_token: 'a1b2c3d4e5f60718293a4b5c6d7e8f90',
    active: true,
    created_at: '2026-11-02T09:00:00+09:00',
    last_seen_at: null,
    coding_level: 'C2',
    enabled_subjects: ['english', 'coding'],
  },
  {
    id: 'stu-junwoo',
    name: '박준우',
    class_name: '초등B',
    grade: 6,
    level: 3,
    tosel_level: 'Basic',
    pin: '2222',
    nickname: '코딩준우',
    parent_token: 'b2c3d4e5f60718293a4b5c6d7e8f9012',
    active: true,
    created_at: '2026-11-02T09:10:00+09:00',
    last_seen_at: null,
    coding_level: 'C3',
    enabled_subjects: ['english', 'coding'],
  },
  {
    id: 'stu-haeun',
    name: '이하은',
    class_name: '초등A',
    grade: 3,
    level: 2,
    tosel_level: 'Starter',
    pin: '3333',
    nickname: '하늘이',
    parent_token: 'c3d4e5f60718293a4b5c6d7e8f901234',
    active: true,
    created_at: '2026-11-03T10:00:00+09:00',
    last_seen_at: null,
    // 코딩만 수강 — 로그인하면 코딩 화면으로 바로 들어갑니다 (원장님 과목 권한 예시)
    coding_level: 'C1',
    enabled_subjects: ['coding'],
  },
  {
    id: 'stu-minjun',
    name: '최민준',
    class_name: '중등A',
    grade: 7,
    level: 4,
    tosel_level: 'Junior',
    pin: '4444',
    nickname: '민준게임',
    parent_token: 'd4e5f60718293a4b5c6d7e8f90123456',
    active: true,
    created_at: '2026-11-04T11:00:00+09:00',
    last_seen_at: null,
    coding_level: 'C4',
    enabled_subjects: ['english', 'coding'],
  },
  {
    id: 'stu-yujin',
    name: '정유진',
    class_name: '초등A',
    grade: 2,
    level: 1,
    tosel_level: 'Pre-Starter',
    pin: '5555',
    nickname: '유진별',
    parent_token: 'e5f60718293a4b5c6d7e8f9012345678',
    active: true,
    created_at: '2026-11-05T14:00:00+09:00',
    last_seen_at: null,
    // 영어만 수강 — 코딩 전환 버튼이 보이지 않는 예시
    coding_level: 'C1',
    enabled_subjects: ['english'],
  },
];

export const SEED_WORD_SETS: WordSet[] = ([1, 2, 3, 4, 5] as Level[]).flatMap((level) => [
  {
    id: `set-L${level}-D01`,
    name: `Level ${level} · Day 01`,
    level,
    day_index: 1,
    active: true,
    created_at: '2026-11-01T00:00:00+09:00',
  },
  {
    id: `set-L${level}-D02`,
    name: `Level ${level} · Day 02`,
    level,
    day_index: 2,
    active: true,
    created_at: '2026-11-01T00:00:00+09:00',
  },
]);

export const SEED_WORDS: Word[] = ([1, 2, 3, 4, 5] as Level[]).flatMap((level) => {
  const rows = LEVEL_ROWS[level];
  return rows.map(([word, meaning, pos, ipa, example, example_ko], idx) => {
    const day = idx < 10 ? 1 : 2;
    return {
      id: `w-L${level}-${String(idx + 1).padStart(2, '0')}`,
      set_id: `set-L${level}-D${String(day).padStart(2, '0')}`,
      word,
      meaning,
      pos,
      ipa,
      example,
      example_ko,
      order_no: (idx % 10) + 1,
    };
  });
});

export const SEED_ADMIN_PIN = '9999';

/** 하루 캐시 적립 상한 기본값 (원) */
export const DEFAULT_CASH_DAILY_LIMIT = 50;

/** 기프티콘 상점 초기 데모 상품 */
export const SEED_SHOP_ITEMS: ShopItem[] = [
  { id: 'item-chupachups', name: '츄파춥스', price: 300, emoji: '🍭', active: true, sort_no: 1, created_at: '2026-11-10T09:00:00+09:00' },
  { id: 'item-banana-milk', name: '바나나맛 우유', price: 1500, emoji: '🥛', active: true, sort_no: 2, created_at: '2026-11-10T09:00:00+09:00' },
  { id: 'item-cu-3000', name: 'CU 모바일금액권 3,000원', price: 3000, emoji: '🎟️', active: true, sort_no: 3, created_at: '2026-11-10T09:00:00+09:00' },
  { id: 'item-br-single', name: '배스킨라빈스 싱글레귤러', price: 3900, emoji: '🍦', active: true, sort_no: 4, created_at: '2026-11-10T09:00:00+09:00' },
];

/**
 * 데모용 지갑 잔액 — 상점·교환 흐름을 바로 시연할 수 있게 넣어 둔 값입니다.
 * (실제 학원 계정에서는 0원에서 시작하고, 짝맞추기 게임으로만 쌓입니다)
 */
export const SEED_WALLET_BALANCES: Record<string, number> = {
  'stu-seoyeon': 1280,
  'stu-junwoo': 3300, // 아래 데모 대기 신청(츄파춥스 300원)을 이미 차감한 잔액
  'stu-haeun': 450,
  'stu-minjun': 2150,
  'stu-yujin': 120,
};

/** 데모용 교환 신청 내역 (관리자 화면의 발송 완료/취소 처리 시연) */
export function seedRedemptions(today: string): RedemptionRequest[] {
  return [
    {
      id: 'rdm-demo-1',
      student_id: 'stu-junwoo',
      item_id: 'item-chupachups',
      item_name: '츄파춥스',
      price: 300,
      status: 'pending',
      requested_at: `${today}T16:40:00+09:00`,
      handled_at: null,
    },
    {
      id: 'rdm-demo-2',
      student_id: 'stu-seoyeon',
      item_id: 'item-banana-milk',
      item_name: '바나나맛 우유',
      price: 1500,
      status: 'sent',
      requested_at: '2026-11-14T17:20:00+09:00',
      handled_at: '2026-11-15T09:10:00+09:00',
    },
  ];
}

/** 학생별 지갑 초기값 */
export function seedWallets(students: Student[], today: string): CashWallet[] {
  return students.map((s) => ({
    student_id: s.id,
    cash_balance: SEED_WALLET_BALANCES[s.id] ?? 0,
    daily_cash_earned: 0,
    earned_date: today,
    updated_at: `${today}T09:00:00+09:00`,
  }));
}


/** 데모 로그인 안내용 PIN 표 (학생 id → 4자리) */
export const SEED_DEMO_PINS: Record<string, string> = Object.fromEntries(
  SEED_STUDENTS.map((s) => [s.id, s.pin])
);

/**
 * 데모용 코딩 오답 노트 — 관리자 「코딩」 탭과 학생 오답노트를 바로 시연할 수 있게 넣어 둡니다.
 * (김서연은 C2 파이썬, 박준우는 C3 C언어 문제를 틀린 상태)
 */
export function seedCodingWrongNotes(today: string): CodingWrongNote[] {
  return [
    {
      student_id: 'stu-seoyeon',
      problem_id: 'c2-03',
      level: 'C2',
      miss_count: 2,
      last_wrong_at: `${today}T17:20:00+09:00`,
      cleared_at: null,
    },
    {
      student_id: 'stu-seoyeon',
      problem_id: 'c2-07',
      level: 'C2',
      miss_count: 1,
      last_wrong_at: `${today}T17:24:00+09:00`,
      cleared_at: null,
    },
    {
      student_id: 'stu-junwoo',
      problem_id: 'c3-02',
      level: 'C3',
      miss_count: 1,
      last_wrong_at: `${today}T18:05:00+09:00`,
      cleared_at: null,
    },
  ];
}

export const LEVEL1_WORD_COUNT = L1.length;
