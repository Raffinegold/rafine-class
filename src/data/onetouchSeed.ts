/**
 * 원터치화 1단계 시드 (2026-11-26)
 *  · 파이썬 1~4주(8차시) × 기질 4종 × (숙제·문제·팁) = 96건
 *  · 대회·IT뉴스 초기 시드
 *  DB 시드 스크립트(scripts/seed-onetouch.mjs)와 앱의 로컬(데모) 폴백이 이 파일을 함께 씁니다.
 */

export type TemperamentType = 'SYSTEMATIC' | 'EXPLORER' | 'CREATOR' | 'CHALLENGER';
export type MissionKind = 'homework' | 'problem' | 'tip';

export interface MissionSeedRow {
  track: 'python';
  week: number;
  session: 1 | 2;
  temperament: TemperamentType;
  kind: MissionKind;
  title: string;
  body: string;
  hint?: string;
  answer?: string;
}

export interface CompetitionSeedRow {
  seed_key: string;
  title: string;
  host: string;
  target: 'elem' | 'middle' | 'high' | 'all';
  start_date?: string | null;
  end_date?: string | null;
  event_date?: string | null;
  url: string;
  summary: string;
  sort_no: number;
}

export interface NewsSeedRow {
  seed_key: string;
  title: string;
  source: string;
  url: string;
  summary: string;
  tag: string;
  published_at: string;
  sort_no: number;
}

/** 기질별 학습 처방 한 줄 (학생 화면 '내 기질 맞춤' 카드 상단에 씁니다) */
export const TEMPERAMENT_LENS: Record<TemperamentType, string> = {
  SYSTEMATIC: '순서와 틀을 먼저 잡으면 힘이 나는 타입 — 오늘도 단계와 규칙으로 정리해요.',
  EXPLORER: '왜 그런지 끝까지 파고들 때 가장 오래 기억하는 타입 — 오늘은 원리를 확인해요.',
  CREATOR: '만들고 보여 줄 때 실력이 붙는 타입 — 오늘은 내 것으로 바꿔 표현해요.',
  CHALLENGER: '일단 해 보고 고치는 타입 — 오늘은 시간을 정해 미션처럼 풀어요.',
};

export const MISSION_SEED: MissionSeedRow[] = [
  /* ===================== 1주 1회차 · 변수·input·f-string → 소개 카드 ===================== */
  {
    track: 'python', week: 1, session: 1, temperament: 'SYSTEMATIC', kind: 'homework',
    title: '내 카드 코드에 1·2·3 단계 번호 붙이기',
    body: '오늘 만든 소개 카드 코드의 각 줄 위에 # 1단계, # 2단계처럼 번호 주석을 붙여 보세요. 그다음 주석만 보고 빈 파일에 똑같이 다시 쳐 봅니다(3번 반복).',
    hint: '주석은 # 뒤에 쓰면 컴퓨터가 읽지 않아요.',
  },
  {
    track: 'python', week: 1, session: 1, temperament: 'SYSTEMATIC', kind: 'problem',
    title: '카드가 나오는 순서 맞히기',
    body: '다음 네 줄이 섞여 있습니다. 소개 카드가 되도록 순서를 정하세요.\n① print("=" * 22)\n② name = input("이름: ")\n③ print(f"이름: {name}")\n④ print("=" * 22)',
    hint: '값을 먼저 받고, 그다음 보여 줍니다. 테두리는 위아래 한 번씩.',
    answer: '② → ① → ③ → ④\n(이름을 받고 → 윗테두리 → 이름 출력 → 아랫테두리)',
  },
  {
    track: 'python', week: 1, session: 1, temperament: 'SYSTEMATIC', kind: 'tip',
    title: '24주 내내 쓰는 4단계 순서',
    body: '① 변수 만들기 ② input으로 받기 ③ print로 보여 주기 ④ f-string으로 끼우기.\n이 순서가 앞으로 나오는 거의 모든 프로그램의 뼈대입니다. 순서만 몸에 익으면 새 문법이 붙어도 덜 헤매요.',
  },

  {
    track: 'python', week: 1, session: 1, temperament: 'EXPLORER', kind: 'homework',
    title: 'f를 지우면 무슨 일이 생길까?',
    body: '내 카드 코드에서 f"..." 의 f만 지우고 실행해 보세요. 화면에 무엇이 나오는지, 왜 그런지 한 줄로 적어 오세요.',
    hint: 'f가 없으면 {name}이 글자 그대로 보입니다.',
  },
  {
    track: 'python', week: 1, session: 1, temperament: 'EXPLORER', kind: 'problem',
    title: '출력 결과를 먼저 예상하기',
    body: '아래 코드의 출력을 실행 전에 종이에 적어 보세요.\na = 10\nb = "10"\nprint(a + a)\nprint(b + b)',
    hint: 'a는 숫자, b는 따옴표로 감싼 글자입니다.',
    answer: '20 / 1010\n숫자는 더하고, 글자는 이어 붙입니다.',
  },
  {
    track: 'python', week: 1, session: 1, temperament: 'EXPLORER', kind: 'tip',
    title: '값이 어디서 오는지 화살표로 따라가기',
    body: 'print 안의 값이 어디서 왔는지 화살표로 표시해 보세요: input → 변수 상자 → f-string의 {} → 화면.\n"이 글자가 어디서 왔지?"를 스스로 답할 수 있으면 변수를 이해한 것입니다.',
  },

  {
    track: 'python', week: 1, session: 1, temperament: 'CREATOR', kind: 'homework',
    title: '내 카드를 내 캐릭터로 바꾸기',
    body: '소개 카드의 문구·테두리 기호·순서를 내 별명과 좋아하는 것으로 바꿔 보세요. 가족이나 친구에게 보여 주고 달라진 점 1개를 적어 오세요.',
  },
  {
    track: 'python', week: 1, session: 1, temperament: 'CREATOR', kind: 'problem',
    title: '가운데 정렬 카드 만들기',
    body: '이름·좋아하는 것·오늘 기분을 입력받아, 20칸짜리 테두리 안에 들어가는 나만의 카드를 만드세요. 조건: 테두리 위아래, 안내 문구 한 줄, 값 세 줄.',
    hint: 'print("★" * 20)처럼 기호에 숫자를 곱하면 테두리가 됩니다.',
    answer: 'name = input("이름: ")\nlike = input("좋아하는 것: ")\nmood = input("오늘 기분: ")\nprint("★" * 20)\nprint("  오늘의 카드")\nprint("★" * 20)\nprint(f"이름 : {name}")\nprint(f"좋아하는 것 : {like}")\nprint(f"기분 : {mood}")\nprint("★" * 20)',
  },
  {
    track: 'python', week: 1, session: 1, temperament: 'CREATOR', kind: 'tip',
    title: '종이에 먼저 그리면 두 배 빨라져요',
    body: '카드 디자인을 종이에 먼저 그려 보세요. 어디에 무엇이 들어갈지 정해 두면 코드는 그 그림을 옮기는 일이 됩니다.\n예쁘게 만드는 것도 실력입니다. 결과물을 보여 줄 때 배운 것이 오래 남아요.',
  },

  {
    track: 'python', week: 1, session: 1, temperament: 'CHALLENGER', kind: 'homework',
    title: '3분 타이머: 빈 파일에서 카드 다시 만들기',
    body: '타이머를 3분 맞추고, 빈 파일에서 소개 카드 코드를 처음부터 쳐서 실행까지 해 보세요. 걸린 시간을 적어 두고 다음 날 1분 줄여 보세요.',
  },
  {
    track: 'python', week: 1, session: 1, temperament: 'CHALLENGER', kind: 'problem',
    title: '망가진 카드 1개 고치기',
    body: '아래 코드를 실행하면 오류가 납니다. 어디가 문제인지 찾아 고치세요.\nname = input("이름: ")\nprint(f"안녕 {name}!)',
    hint: '따옴표와 괄호의 짝을 세어 보세요.',
    answer: 'print(f"안녕 {name}!")  ← 마지막 따옴표와 ) 위치',
  },
  {
    track: 'python', week: 1, session: 1, temperament: 'CHALLENGER', kind: 'tip',
    title: '오류는 마지막 줄부터 읽기',
    body: '빨간 글씨가 무서워 보여도, 제일 아래 한 줄에 원인이 있습니다. 대부분 따옴표·괄호·들여쓰기 중 하나예요.\n고치고 → 다시 실행 → 또 고치기. 이 반복이 실력입니다.',
  },

  /* ===================== 1주 2회차 · int()·계산·에러 3종 ===================== */
  {
    track: 'python', week: 1, session: 2, temperament: 'SYSTEMATIC', kind: 'homework',
    title: '에러 3종을 내 말로 정의하기',
    body: '문법 오류(SyntaxError)·실행 오류(TypeError/ValueError)·논리 오류를 각각 한 줄로 노트에 적고, 오늘 고친 코드 3개 옆에 어떤 오류였는지 표시해 오세요.',
  },
  {
    track: 'python', week: 1, session: 2, temperament: 'SYSTEMATIC', kind: 'problem',
    title: '오류 종류 맞히고 고치기',
    body: 'A) print(f"안녕 {name}님)\nB) age = input("나이: ")\n   print(age + 1)\nC) mood = "good"\n   print("오늘 기분은 {mood}")',
    hint: 'A는 문법, B는 형(type), C는 빨간 글씨 없이 결과만 이상한 논리 오류.',
    answer: 'A 문법 오류 → print(f"안녕 {name}님")\nB 실행 오류(TypeError) → age = int(input("나이: "))\nC 논리 오류 → print(f"오늘 기분은 {mood}")',
  },
  {
    track: 'python', week: 1, session: 2, temperament: 'SYSTEMATIC', kind: 'tip',
    title: '빨간 글씨 첫 줄에 이름이 있어요',
    body: 'SyntaxError(문법) · TypeError(형이 안 맞음) · ValueError(값이 안 맞음). 이 세 이름만 외워도 오류의 절반은 바로 짚입니다.\n오류 이름 → 그 줄 → 따옴표/괄호/int 순서로 확인하세요.',
  },

  {
    track: 'python', week: 1, session: 2, temperament: 'EXPLORER', kind: 'homework',
    title: 'input과 int의 차이를 type()으로 확인',
    body: 'a = input("숫자: ")와 b = int(input("숫자: "))를 각각 만든 뒤 print(type(a)), print(type(b))를 실행해 결과를 적어 오세요.',
    answer: "<class 'str'> / <class 'int'>",
  },
  {
    track: 'python', week: 1, session: 2, temperament: 'EXPLORER', kind: 'problem',
    title: '왜 age + 1이 안 될까? 3문장으로 설명',
    body: 'age = input("나이: ") 로 받은 값으로 age + 1을 하면 왜 오류가 나는지 세 문장으로 설명하고, 고친 코드를 쓰세요.',
    hint: 'input이 돌려주는 것은 숫자가 아니라 글자입니다.',
    answer: 'input은 항상 글자(str)를 돌려준다. 글자 "14"에 숫자 1을 더할 수 없다. 그래서 int(input(...))으로 숫자로 바꿔야 한다.',
  },
  {
    track: 'python', week: 1, session: 2, temperament: 'EXPLORER', kind: 'tip',
    title: 'int()는 문이라고 생각하세요',
    body: '글자 "14"가 int()라는 문을 통과하면 숫자 14가 됩니다. 통과하지 못하면 계산을 못 해요.\n계산이 이상하면 "이 값이 지금 글자인가, 숫자인가"를 먼저 확인하세요.',
  },

  {
    track: 'python', week: 1, session: 2, temperament: 'CREATOR', kind: 'homework',
    title: '내년 나이·태어난 해를 넣어 가족에게 보여 주기',
    body: '내 카드에 내년 나이와 태어난 해 계산을 넣고, 가족에게 보여 준 뒤 들은 반응 한 줄을 적어 오세요.',
  },
  {
    track: 'python', week: 1, session: 2, temperament: 'CREATOR', kind: 'problem',
    title: '계산 결과를 문장으로 예쁘게',
    body: '나이를 입력받아 "올해 14살, 내년 15살, 100살까지 86년!"처럼 한 문장으로 출력하세요. 숫자 계산은 그대로, 보여 주는 문장은 내가 만드세요.',
    hint: 'f-string 중괄호 안에서 {age + 1}처럼 계산을 바로 할 수 있어요.',
    answer: 'age = int(input("나이: "))\nprint(f"올해 {age}살, 내년 {age+1}살, 100살까지 {100-age}년!")',
  },
  {
    track: 'python', week: 1, session: 2, temperament: 'CREATOR', kind: 'tip',
    title: '계산은 숫자로, 보여 주기는 문장으로',
    body: '계산한 값을 그대로 출력하면 재미가 없습니다. "그래서 나한테 무슨 의미인지" 한 문장을 붙여 보세요.\n카드·영수증·추천기 모두 이 원리로 만들어진답니다.',
  },

  {
    track: 'python', week: 1, session: 2, temperament: 'CHALLENGER', kind: 'homework',
    title: '5분 에러 사냥: 3개 만들고 3개 고치기',
    body: '일부러 오류 3개(따옴표·int 빼기·f 빼기)를 만들고, 친구와 코드를 바꿔 서로 고쳐 주세요. 5분 안에 끝내기.',
  },
  {
    track: 'python', week: 1, session: 2, temperament: 'CHALLENGER', kind: 'problem',
    title: '3개를 가장 빠르게 고치기',
    body: 'A) print(f"안녕 {name}!)   B) age = input("나이: ") / print(age + 1)   C) print("기분: {mood}")\n각각 고친 코드를 쓰고, 어떤 오류였는지 한 단어로 적으세요.',
    answer: 'A 문법 → print(f"안녕 {name}!")\nB 실행 → age = int(input("나이: "))\nC 논리 → print(f"기분: {mood}")',
  },
  {
    track: 'python', week: 1, session: 2, temperament: 'CHALLENGER', kind: 'tip',
    title: '에러는 숙제입니다',
    body: '하나 고칠 때마다 실력이 1씩 올라갑니다. 빨간 글씨가 나오면 "지금 배울 게 나왔다"고 생각하세요.\n순서: 마지막 줄 읽기 → 그 줄 확인 → 따옴표·괄호·int → 다시 실행.',
  },

  /* ===================== 2주 1회차 · //, %, ** · 용돈 계산기 ===================== */
  {
    track: 'python', week: 2, session: 1, temperament: 'SYSTEMATIC', kind: 'homework',
    title: '//, %, ** 를 한 줄씩 정의하고 계산하기',
    body: '7 // 2, 7 % 2, 2 ** 3의 답을 손으로 계산해 적고, 코드로 실행해 확인하세요. 세 연산자가 각각 무엇을 하는지 한 줄씩 적어 오세요.',
    answer: '3 / 1 / 8 — //는 몫, %는 나머지, **는 거듭제곱',
  },
  {
    track: 'python', week: 2, session: 1, temperament: 'SYSTEMATIC', kind: 'problem',
    title: '10000원으로 3000원짜리 몇 개?',
    body: '10000원으로 3000원짜리를 살 때, 살 수 있는 개수와 남는 돈을 //와 %로 각각 구하세요.',
    hint: '개수는 //, 남는 돈은 %.',
    answer: 'print(10000 // 3000)  # 3\nprint(10000 % 3000)   # 1000',
  },
  {
    track: 'python', week: 2, session: 1, temperament: 'SYSTEMATIC', kind: 'tip',
    title: '몇 개 살 수 있나 = //, 얼마 남나 = %',
    body: '계산기 문제는 이 두 문장으로 대부분 풀립니다.\n"몇 개"를 물으면 //, "얼마 남아"를 물으면 %. 문제를 읽고 어느 쪽인지 먼저 표시하세요.',
  },

  {
    track: 'python', week: 2, session: 1, temperament: 'EXPLORER', kind: 'homework',
    title: '0.1 + 0.2는 왜 0.3이 아닐까?',
    body: 'print(0.1 + 0.2)를 실행해 보고, 왜 0.30000000000000004가 나오는지 찾아 한 줄로 적어 오세요(검색해도 좋아요).',
    answer: '컴퓨터는 소수를 2진수로 저장해서 아주 작은 오차가 생깁니다.',
  },
  {
    track: 'python', week: 2, session: 1, temperament: 'EXPLORER', kind: 'problem',
    title: '출력 예상: / 와 // 의 차이',
    body: 'print(7 // 2, 7 % 2, 7 / 2)의 출력을 실행 전에 예상해 적으세요.',
    hint: '/ 는 항상 소수로 나눕니다.',
    answer: '3 1 3.5',
  },
  {
    track: 'python', week: 2, session: 1, temperament: 'EXPLORER', kind: 'tip',
    title: '컴퓨터의 나눗셈은 두 종류',
    body: '/ 는 정확히 나누고(소수), // 는 버림, % 는 나머지.\n"왜 결과가 3.5가 아니라 3이 나오지?" 싶으면 어떤 나눗셈을 썼는지 확인하세요.',
  },

  {
    track: 'python', week: 2, session: 1, temperament: 'CREATOR', kind: 'homework',
    title: '내 용돈으로 계산기 바꾸기',
    body: '오늘 만든 용돈 계산기의 금액을 내 용돈과 사고 싶은 물건 가격으로 바꿔 실행하고, 영수증 화면을 예쁘게 꾸며 사진으로 남겨 오세요.',
  },
  {
    track: 'python', week: 2, session: 1, temperament: 'CREATOR', kind: 'problem',
    title: '보기 좋은 영수증 만들기',
    body: '상품명·가격·개수를 입력받아 총액과 거스름돈을 표처럼 출력하세요. 테두리와 제목은 내가 정합니다.',
    hint: 'print("=" * 30)으로 위아래를 감싸면 영수증처럼 보입니다.',
    answer: 'name = input("상품: ")\nprice = int(input("가격: "))\ncount = int(input("개수: "))\ntotal = price * count\nprint("=" * 30)\nprint(f"  {name} 영수증")\nprint("=" * 30)\nprint(f"{name}  {price}원 x {count}개")\nprint(f"총액 : {total}원")\nprint("=" * 30)',
  },
  {
    track: 'python', week: 2, session: 1, temperament: 'CREATOR', kind: 'tip',
    title: '결과보다 보기 좋은 결과가 기억에 남아요',
    body: '같은 계산이라도 표로 정리하면 읽는 사람이 바로 이해합니다.\n출력하기 전에 "이 화면을 친구에게 보여 주면 이해될까?"를 한 번만 물어보세요.',
  },

  {
    track: 'python', week: 2, session: 1, temperament: 'CHALLENGER', kind: 'homework',
    title: '2분 암산 미션',
    body: '10000 // 3000, 10000 % 3000을 2분 안에 말로 답하고 이유를 설명하세요. 그다음 코드로 확인합니다.',
  },
  {
    track: 'python', week: 2, session: 1, temperament: 'CHALLENGER', kind: 'problem',
    title: '5000원으로 아이스크림 몇 개?',
    body: '5000원으로 1200원 아이스크림을 살 때 개수와 남는 돈을 코드로 구하세요. 그리고 남는 돈이 100원보다 적게 만드는 방법도 찾아보세요.',
    answer: 'print(5000 // 1200)  # 4\nprint(5000 % 1200)   # 200\n→ 4개 사고 200원이 남습니다. 5개를 사려면 6000원이 필요합니다.',
  },
  {
    track: 'python', week: 2, session: 1, temperament: 'CHALLENGER', kind: 'tip',
    title: '먼저 예상, 그다음 실행',
    body: '계산 문제는 손으로 답을 먼저 예상하고 코드로 확인하세요. 예상과 다르면 그 차이가 오늘의 공부입니다.\n틀린 예상은 지우지 말고 옆에 이유를 적어 두면 복습이 됩니다.',
  },

  /* ===================== 2주 2회차 · len·정렬·영수증 표 ===================== */
  {
    track: 'python', week: 2, session: 2, temperament: 'SYSTEMATIC', kind: 'homework',
    title: '표가 안 깨지는 규칙 3가지 적기',
    body: '오늘 만든 영수증에서 칸을 맞추는 규칙을 3가지로 정리해 오세요. (예: 가장 긴 이름 기준, 콜론 위치 통일, 테두리 길이 고정)',
  },
  {
    track: 'python', week: 2, session: 2, temperament: 'SYSTEMATIC', kind: 'problem',
    title: 'len으로 칸 너비 정하기',
    body: '상품명 세 개를 입력받아, 가장 긴 이름의 글자 수를 len으로 구하고 그 길이만큼 줄을 맞춰 출력하세요.',
    hint: 'longest = max(len(a), len(b), len(c)) 로 가장 긴 길이를 먼저 구합니다.',
    answer: 'a = input("1: ")\nb = input("2: ")\nc = input("3: ")\nlongest = max(len(a), len(b), len(c))\nprint("=" * (longest + 10))\nprint(a)\nprint(b)\nprint(c)\nprint("=" * (longest + 10))',
  },
  {
    track: 'python', week: 2, session: 2, temperament: 'SYSTEMATIC', kind: 'tip',
    title: '표는 가장 긴 값을 기준으로',
    body: '칸 너비를 짧은 값에 맞추면 긴 이름에서 깨집니다. 먼저 len으로 재고, 가장 긴 값에 맞춘 뒤 나머지를 채우세요.\n이 순서만 지키면 어떤 표도 무너지지 않습니다.',
  },

  {
    track: 'python', week: 2, session: 2, temperament: 'EXPLORER', kind: 'homework',
    title: 'len은 무엇을 셀까?',
    body: 'print(len("안녕")), print(len("hello")), print(len("안녕 hi"))의 결과를 예상하고 실행해 확인하세요. 왜 그런지 한 줄로 적어 오세요.',
    answer: '2 / 5 / 5 — len은 글자 수를 셉니다(공백도 한 글자).',
  },
  {
    track: 'python', week: 2, session: 2, temperament: 'EXPLORER', kind: 'problem',
    title: '화면 폭과 글자 수는 다르다',
    body: '한글과 영문을 섞어 표를 만들면 왜 줄이 어긋나는지 설명하고, 어긋남을 줄이는 방법을 한 가지 제안하세요.',
    hint: '한글은 한 글자가 화면에서 더 넓게 보입니다.',
    answer: 'len은 글자 수만 세고 화면 폭은 세지 않기 때문입니다. 한글은 보통 영문보다 넓어서, 한글·영문을 섞으면 칸이 어긋납니다. 한 종류만 쓰거나 칸을 넉넉히 잡으면 덜 어긋납니다.',
  },
  {
    track: 'python', week: 2, session: 2, temperament: 'EXPLORER', kind: 'tip',
    title: '세는 것과 보이는 것은 다를 수 있어요',
    body: '컴퓨터가 세는 글자 수와 눈에 보이는 폭은 다릅니다. 표가 어긋날 때 "len이 틀렸나?"보다 "폭이 다른 글자가 섞였나?"를 먼저 확인하세요.',
  },

  {
    track: 'python', week: 2, session: 2, temperament: 'CREATOR', kind: 'homework',
    title: '내 물건 3개로 영수증 만들기',
    body: '내가 산 물건 3개로 영수증을 만들어 가족에게 보여 주고, 가장 마음에 든 칭찬 한마디를 적어 오세요.',
  },
  {
    track: 'python', week: 2, session: 2, temperament: 'CREATOR', kind: 'problem',
    title: '나만의 영수증 한 줄',
    body: '오늘 영수증 맨 아래에 "오늘의 한 줄"(감사 인사나 가게 문구)을 넣어 나만의 영수증으로 완성하세요.',
    hint: '맨 위 제목 · 가운데 표 · 맨 아래 한 줄, 이 3단 구성이면 깔끔합니다.',
    answer: 'print("=" * 30)\nprint("  라피네 문구점")\nprint("=" * 30)\nprint("연필   500원 x 2")\nprint("지우개 300원 x 1")\nprint("=" * 30)\nprint("총액 : 1,300원")\nprint("오늘도 와 주셔서 고마워요!")',
  },
  {
    track: 'python', week: 2, session: 2, temperament: 'CREATOR', kind: 'tip',
    title: '영수증도 작품입니다',
    body: '제목·표·한 줄. 이 세 가지만 있으면 읽는 사람이 편합니다.\n내가 만든 화면을 사진으로 남겨 두면 나중에 포트폴리오에 그대로 들어갑니다.',
  },

  {
    track: 'python', week: 2, session: 2, temperament: 'CHALLENGER', kind: 'homework',
    title: '3분 안에 영수증 다시 만들기',
    body: '오늘 코드를 보지 않고 3분 안에 영수증을 다시 만들어 실행까지 해 보세요. 틀려도 괜찮습니다. 실행이 목표!',
  },
  {
    track: 'python', week: 2, session: 2, temperament: 'CHALLENGER', kind: 'problem',
    title: '어긋난 표 고치기',
    body: '상품명 길이가 달라 표가 어긋난 코드를 고치세요. 조건: 이름이 몇 글자든 테두리와 아래 줄이 맞아야 합니다.',
    hint: '가장 긴 이름을 len으로 재서 테두리 길이를 정하면 됩니다.',
    answer: 'names = ["연필", "지우개", "색연필세트"]\nlongest = max(len(n) for n in names)\nprint("=" * (longest + 8))\nfor n in names:\n    print(n)\nprint("=" * (longest + 8))',
  },
  {
    track: 'python', week: 2, session: 2, temperament: 'CHALLENGER', kind: 'tip',
    title: '어긋나면 딱 한 곳만',
    body: '표가 어긋날 때는 가장 긴 이름부터 확인하세요. 대부분 테두리 길이 한 곳만 고치면 정리됩니다.\n한 번에 다 고치려 하지 말고, 한 곳 고치고 실행해 확인하는 게 빠릅니다.',
  },

  /* ===================== 3주 1회차 · if / elif / else · 나이별 요금 ===================== */
  {
    track: 'python', week: 3, session: 1, temperament: 'SYSTEMATIC', kind: 'homework',
    title: 'if → elif → else 순서와 들여쓰기 정리',
    body: '조건문의 순서와 들여쓰기 규칙을 3줄로 노트에 정리하고, 오늘 코드에서 들여쓰기가 빠진 곳이 있었는지 표시해 오세요.',
  },
  {
    track: 'python', week: 3, session: 1, temperament: 'SYSTEMATIC', kind: 'problem',
    title: '나이별 요금표를 코드로',
    body: '7세 미만 무료, 7~12세 5000원, 13세 이상 8000원을 출력하세요. 빈칸을 채우세요.\nage = int(input("나이: "))\nif age < 7:\n    print("무료")\n____ age < 13:\n    print("5000원")\n____:\n    print("8000원")',
    answer: 'elif / else',
  },
  {
    track: 'python', week: 3, session: 1, temperament: 'SYSTEMATIC', kind: 'tip',
    title: '넓은 조건을 위에 두면 아래가 안 돌아요',
    body: '조건은 위에서부터 차례로 검사하고, 처음 맞는 곳에서 멈춥니다.\n그래서 좁은 조건(작은 범위)을 위에, 넓은 조건을 아래에 둡니다. 순서를 바꾸면 결과가 달라져요.',
  },

  {
    track: 'python', week: 3, session: 1, temperament: 'EXPLORER', kind: 'homework',
    title: 'if를 안 쓰면 얼마나 길어질까?',
    body: '같은 요금 안내를 if 없이 print만으로 만들면 몇 줄이 필요한지 세어 보고, if를 쓰면 몇 줄인지 비교해 오세요.',
  },
  {
    track: 'python', week: 3, session: 1, temperament: 'EXPLORER', kind: 'problem',
    title: 'elif는 왜 age < 7을 다시 안 물을까?',
    body: 'if age < 7: ... elif age < 13: ... 에서 두 번째 조건이 age < 7을 다시 검사하지 않아도 되는 이유를 설명하세요.',
    hint: 'elif는 "앞의 조건이 아니었다면"이라는 뜻입니다.',
    answer: 'elif는 위의 if가 거짓일 때만 검사되므로, 이미 age가 7 이상임이 확인된 상태입니다. 그래서 다시 7 미만인지 물을 필요가 없습니다.',
  },
  {
    track: 'python', week: 3, session: 1, temperament: 'EXPLORER', kind: 'tip',
    title: '경계값에서 답이 갈립니다',
    body: '< 와 <= 의 차이는 딱 경계값에서 드러납니다. 7살은 무료일까요, 5000원일까요? 문제를 읽고 경계를 정확히 정하세요.\n6, 7, 12, 13을 꼭 넣어 테스트해 보세요.',
  },

  {
    track: 'python', week: 3, session: 1, temperament: 'CREATOR', kind: 'homework',
    title: '우리 가족 요금 안내 문구 만들기',
    body: '우리 가족 나이를 넣어 각각 얼마인지 계산해 보고, 가족에게 보여 줄 안내 문구를 만들어 오세요.',
  },
  {
    track: 'python', week: 3, session: 1, temperament: 'CREATOR', kind: 'problem',
    title: '존댓말 요금 카드',
    body: '나이에 따라 "어린이 손님은 5,000원입니다"처럼 존댓말로 다른 문장이 나오는 안내 카드를 만드세요.',
    answer: 'age = int(input("나이: "))\nif age < 7:\n    print("어린이 손님은 무료입니다 :)")\nelif age < 13:\n    print("어린이 손님은 5,000원입니다")\nelse:\n    print("일반 손님은 8,000원입니다")',
  },
  {
    track: 'python', week: 3, session: 1, temperament: 'CREATOR', kind: 'tip',
    title: '같은 if라도 문장이 안내판을 만듭니다',
    body: '"5000원"보다 "어린이 손님은 5,000원입니다"가 훨씬 친절하게 느껴집니다.\n결과가 맞았으면, 그다음은 읽는 사람을 생각해 문장을 다듬어 보세요.',
  },

  {
    track: 'python', week: 3, session: 1, temperament: 'CHALLENGER', kind: 'homework',
    title: '1분 안에 3개 맞히기',
    body: '나이 5, 10, 15를 넣었을 때 결과를 1분 안에 말해 보세요. 그다음 코드로 확인합니다.',
    answer: '5 → 무료 / 10 → 5000원 / 15 → 8000원',
  },
  {
    track: 'python', week: 3, session: 1, temperament: 'CHALLENGER', kind: 'problem',
    title: '순서를 잘못 쓴 코드 고치기',
    body: '아래 코드는 10살에게 "무료"가 나옵니다. 왜 그런지 찾아 고치세요.\nif age < 13:\n    print("5000원")\nelif age < 7:\n    print("무료")',
    answer: '조건 순서를 좁은 것부터: if age < 7: 무료 / elif age < 13: 5000원',
  },
  {
    track: 'python', week: 3, session: 1, temperament: 'CHALLENGER', kind: 'tip',
    title: '경계값부터 테스트',
    body: '6, 7, 12, 13 — 이 네 숫자만 넣어도 대부분의 실수를 잡습니다.\n"될 것 같은데?"에서 멈추지 말고 직접 넣어 보세요.',
  },

  /* ===================== 3주 2회차 · 순서 논리 오류 · 등급 계산기 ===================== */
  {
    track: 'python', week: 3, session: 2, temperament: 'SYSTEMATIC', kind: 'homework',
    title: '점수 구간표 그리기',
    body: '90 이상 A, 80 이상 B, 70 이상 C, 나머지 D를 표로 그리고, 코드와 한 줄씩 대조해 오세요.',
  },
  {
    track: 'python', week: 3, session: 2, temperament: 'SYSTEMATIC', kind: 'problem',
    title: '등급 계산기 빈칸 채우기',
    body: 'score = int(input("점수: "))\nif score >= 90:\n    print("A")\n____ score >= 80:\n    print("B")\n____ score >= 70:\n    print("C")\n____:\n    print("D")',
    answer: 'elif / elif / else',
  },
  {
    track: 'python', week: 3, session: 2, temperament: 'SYSTEMATIC', kind: 'tip',
    title: '표를 먼저 그리면 코드가 그대로 나옵니다',
    body: '구간표를 종이에 먼저 그리세요. 위에서부터 "90 이상 → 80 이상 → 70 이상 → 나머지"를 그대로 옮기면 됩니다.\n표 없이 코드부터 쓰면 순서를 자주 틀립니다.',
  },

  {
    track: 'python', week: 3, session: 2, temperament: 'EXPLORER', kind: 'homework',
    title: '95점이 B가 나오는 이유 찾기',
    body: '95점을 넣었는데 B가 나오는 코드를 찾아, 왜 그런지 한 줄로 적어 오세요.',
    answer: 'score >= 80 조건이 위에 있어서 95도 먼저 B에서 멈추기 때문입니다.',
  },
  {
    track: 'python', week: 3, session: 2, temperament: 'EXPLORER', kind: 'problem',
    title: '출력 예측 후 고치기',
    body: 'if score >= 80: "B"\nelif score >= 90: "A"\n에 95를 넣으면 무엇이 나올까요? 예상하고, A가 나오게 고치세요.',
    answer: 'B가 나옵니다. 조건 순서를 바꿔 90 이상을 먼저 검사하게 합니다.',
  },
  {
    track: 'python', week: 3, session: 2, temperament: 'EXPLORER', kind: 'tip',
    title: '컴퓨터는 먼저 맞는 조건에서 멈춥니다',
    body: '사람은 "90 이상이면 A"를 먼저 떠올리지만, 컴퓨터는 위에 적힌 순서대로 검사합니다.\n코드를 쓸 때 "내가 쓴 순서대로 검사된다"를 항상 기억하세요.',
  },

  {
    track: 'python', week: 3, session: 2, temperament: 'CREATOR', kind: 'homework',
    title: '나만의 성적표 만들기',
    body: '등급마다 칭찬 문구를 다르게 넣어 나만의 성적표를 만들고, 가족에게 보여 주세요.',
  },
  {
    track: 'python', week: 3, session: 2, temperament: 'CREATOR', kind: 'problem',
    title: '등급 + 응원 한마디',
    body: '등급(A~D)과 함께 응원 문구가 나오는 성적표를 만드세요. A는 "최고!", D는 "다음엔 같이 해 보자!"처럼 내 말로.',
    answer: 'if score >= 90:\n    print("A · 최고예요!")\nelif score >= 80:\n    print("B · 잘했어요!")\nelif score >= 70:\n    print("C · 조금만 더!")\nelse:\n    print("D · 다음엔 같이 해 봐요")',
  },
  {
    track: 'python', week: 3, session: 2, temperament: 'CREATOR', kind: 'tip',
    title: '결과 + 한마디면 다르게 읽힙니다',
    body: '숫자만 있으면 시험이고, 한마디가 있으면 응원이 됩니다.\n내 프로그램을 쓰는 사람이 어떤 기분일지 생각하며 문장을 골라 보세요.',
  },

  {
    track: 'python', week: 3, session: 2, temperament: 'CHALLENGER', kind: 'homework',
    title: '3분 등급 4개 맞히기',
    body: '95, 85, 75, 65를 넣었을 때 등급을 3분 안에 말해 보세요.',
    answer: 'A / B / C / D',
  },
  {
    track: 'python', week: 3, session: 2, temperament: 'CHALLENGER', kind: 'problem',
    title: '순서 오류 2곳 찾기',
    body: '등급 계산기에서 순서 때문에 틀리는 곳 2곳을 찾아 고치고, 고치기 전·후 결과를 비교하세요.',
    hint: '경계값 89, 90을 넣어 보면 드러납니다.',
  },
  {
    track: 'python', week: 3, session: 2, temperament: 'CHALLENGER', kind: 'tip',
    title: '89와 90을 넣어 보세요',
    body: '경계값 테스트가 가장 빠른 버그 사냥입니다. 90, 89, 80, 79를 넣으면 순서 오류는 거의 다 나옵니다.\n버그를 찾으면 "고쳤다"가 아니라 "왜 생겼는지" 한 줄로 적어 두세요.',
  },

  /* ===================== 4주 1회차 · 설계 5칸 · 4갈래 추천기 ===================== */
  {
    track: 'python', week: 4, session: 1, temperament: 'SYSTEMATIC', kind: 'homework',
    title: '설계 5칸 채워 오기',
    body: '누가 쓸지 / 무엇을 추천할지 / 어떤 기준으로 / 결과를 어떻게 보여 줄지 / 마지막 한 줄 — 5칸을 채워 오세요.',
  },
  {
    track: 'python', week: 4, session: 1, temperament: 'SYSTEMATIC', kind: 'problem',
    title: '4갈래 추천기 뼈대 완성',
    body: 'if / elif / elif / else 네 갈래로 서로 다른 추천이 나오게 빈칸을 채우세요. 기준은 하나(예: 예산)로 시작합니다.',
    answer: 'money = int(input("예산: "))\nif money < 5000:\n    print("가볍게 시작하는 입문 세트")\nelif money < 10000:\n    print("혼자 만들기 좋은 기본 세트")\nelif money < 20000:\n    print("작품 하나를 끝낼 수 있는 세트")\nelse:\n    print("여러 작품을 도전하는 세트")',
  },
  {
    track: 'python', week: 4, session: 1, temperament: 'SYSTEMATIC', kind: 'tip',
    title: '설계 5칸이 채워지면 절반이 끝',
    body: '5칸을 다 채우면 코드는 거의 자동으로 나옵니다. 칸이 비어 있으면 코드를 쓰다가 반드시 멈춥니다.\n오늘은 코드보다 5칸을 먼저 완성하세요.',
  },

  {
    track: 'python', week: 4, session: 1, temperament: 'EXPLORER', kind: 'homework',
    title: '내 추천 기준의 반례 3개',
    body: '내가 정한 기준이 맞지 않는 경우를 3개 생각해 오세요. (예: 예산은 충분한데 시간이 없는 경우)',
  },
  {
    track: 'python', week: 4, session: 1, temperament: 'EXPLORER', kind: 'problem',
    title: '기준이 2개면 경우는 몇 갈래?',
    body: '기준을 하나 더 늘리면(예산 + 시간) 결과가 몇 갈래가 되는지 계산하고, 코드가 어떻게 복잡해지는지 정리하세요.',
    answer: '2개 기준이면 2×2 = 4갈래, 3개면 8갈래. 갈래가 늘수록 if가 길어지고 빠뜨리기 쉬워집니다.',
  },
  {
    track: 'python', week: 4, session: 1, temperament: 'EXPLORER', kind: 'tip',
    title: '기준을 늘리면 경우의 수가 곱으로 늘어요',
    body: '기준 1개 = 2갈래, 2개 = 4갈래, 3개 = 8갈래. 그래서 처음엔 기준 하나로 시작하는 게 좋습니다.\n복잡해지면 기준을 줄이는 것도 설계입니다.',
  },

  {
    track: 'python', week: 4, session: 1, temperament: 'CREATOR', kind: 'homework',
    title: '추천기 이름과 첫 문구 3안',
    body: '내 추천기의 이름과 첫 화면에 나올 인사 문구를 3안 만들어 오세요. 친구에게 보여 주고 하나를 고릅니다.',
  },
  {
    track: 'python', week: 4, session: 1, temperament: 'CREATOR', kind: 'problem',
    title: '추천에 이유를 붙이기',
    body: '추천 결과에 "왜 이걸 골랐는지" 이유 한 줄을 붙여 출력하세요.',
    hint: 'if 안에서 print를 두 번 하면 됩니다.',
    answer: 'if money < 5000:\n    print("입문 세트를 추천해요")\n    print("이유: 예산 안에서 첫 작품을 끝낼 수 있어요")',
  },
  {
    track: 'python', week: 4, session: 1, temperament: 'CREATOR', kind: 'tip',
    title: '이유를 말해 줘야 신뢰가 생깁니다',
    body: '추천만 하면 "왜?"가 남습니다. 이유 한 줄이 있으면 프로그램이 똑똑해 보입니다.\n이유는 짧게, 사용자 입장에서 쓰세요.',
  },

  {
    track: 'python', week: 4, session: 1, temperament: 'CHALLENGER', kind: 'homework',
    title: '5분 안에 4갈래 추천기 완성',
    body: '5분 타이머를 맞추고 4갈래 추천기를 완성한 뒤, 친구에게 써 보게 하고 불편한 점 1개를 들어 오세요.',
  },
  {
    track: 'python', week: 4, session: 1, temperament: 'CHALLENGER', kind: 'problem',
    title: '이상한 입력에도 안 죽게',
    body: '예산에 0을 넣거나 글자를 넣어도 프로그램이 멈추지 않게 만들어 보세요.',
    hint: '지금은 int()에서 멈출 수 있습니다. 13주에 try/except로 완벽하게 막습니다. 오늘은 0원만 if로 처리해 보세요.',
    answer: 'if money <= 0:\n    print("예산을 1원 이상 넣어 주세요")\nelif money < 5000:\n    ...',
  },
  {
    track: 'python', week: 4, session: 1, temperament: 'CHALLENGER', kind: 'tip',
    title: '완성 → 이상한 값 → 막기',
    body: '일단 완성하고, 이상한 값을 넣어 보고, 막는 순서가 가장 빠릅니다.\n"완벽하게 만들고 시작"은 대부분 시작을 못 합니다.',
  },

  /* ===================== 4주 2회차 · 예산·이유·1분 발표 ===================== */
  {
    track: 'python', week: 4, session: 2, temperament: 'SYSTEMATIC', kind: 'homework',
    title: '발표 4단 카드 만들기',
    body: '무엇을 만들었나 / 왜 만들었나 / 어떻게 만들었나 / 배운 점 — 4칸 카드를 채워 오세요. 1분 발표는 이 카드만 보면 됩니다.',
  },
  {
    track: 'python', week: 4, session: 2, temperament: 'SYSTEMATIC', kind: 'problem',
    title: '버그 목록 3개와 우선순위',
    body: '내 추천기에서 아쉬운 점 3개를 적고, 그중 지금 고칠 1개를 골라 이유를 쓰세요.',
  },
  {
    track: 'python', week: 4, session: 2, temperament: 'SYSTEMATIC', kind: 'tip',
    title: '발표는 순서가 절반',
    body: '4단 카드만 있으면 1분은 저절로 채워집니다. 카드 없이 말하면 중간에 멈춥니다.\n발표 전에 카드를 소리 내어 한 번 읽어 보세요.',
  },

  {
    track: 'python', week: 4, session: 2, temperament: 'EXPLORER', kind: 'homework',
    title: '내 코드에서 가장 중요한 줄',
    body: '내 추천기에서 가장 중요한 줄 1개를 고르고, 왜 중요한지 설명할 준비를 해 오세요.',
  },
  {
    track: 'python', week: 4, session: 2, temperament: 'EXPLORER', kind: 'problem',
    title: '같은 결과, 다른 방법',
    body: '같은 추천 결과를 내는 다른 방법(예: 조건 순서 바꾸기, 기준을 변수로 빼기)을 한 가지 더 작성해 보세요.',
    answer: '기준을 변수로 빼면 바꾸기 쉽습니다.\nlimit = 5000\nif money < limit: ...',
  },
  {
    track: 'python', week: 4, session: 2, temperament: 'EXPLORER', kind: 'tip',
    title: '설명할 수 있으면 이해한 것',
    body: '코드 한 줄을 골라 "이 줄은 왜 필요할까"를 말해 보세요. 말로 나오지 않으면 아직 내 것이 아닙니다.\n발표는 그 설명을 조금 더 다듬은 것입니다.',
  },

  {
    track: 'python', week: 4, session: 2, temperament: 'CREATOR', kind: 'homework',
    title: '1분 발표 영상 남기기',
    body: '휴대폰으로 1분 발표를 찍어 오세요. 처음엔 어색해도 괜찮습니다. 두 번째가 훨씬 좋아집니다.',
  },
  {
    track: 'python', week: 4, session: 2, temperament: 'CREATOR', kind: 'problem',
    title: '추천기 소개 카드 만들기',
    body: '내 추천기의 제목·한 줄 소개·사용법 3줄을 카드 형태로 정리하세요. 나중에 포트폴리오에 그대로 넣습니다.',
    answer: '제목: 내 용돈 추천기\n한 줄: 예산만 넣으면 딱 맞는 세트를 골라 줍니다\n사용법: 1) 예산 입력 2) 추천 확인 3) 마음에 들면 저장',
  },
  {
    track: 'python', week: 4, session: 2, temperament: 'CREATOR', kind: 'tip',
    title: '첫 문장을 정해 두세요',
    body: '"이건 ~하는 프로그램입니다"로 시작하면 발표가 안정됩니다.\n그다음 왜 만들었는지, 어디가 제일 힘들었는지 순서로 이어 가세요.',
  },

  {
    track: 'python', week: 4, session: 2, temperament: 'CHALLENGER', kind: 'homework',
    title: '친구 추천기 테스트하기',
    body: '친구 추천기를 써 보고 불편한 점 3개를 적어 주세요. 받은 피드백은 공격이 아니라 업데이트 재료입니다.',
  },
  {
    track: 'python', week: 4, session: 2, temperament: 'CHALLENGER', kind: 'problem',
    title: '피드백 1개 반영해 수정',
    body: '받은 피드백 중 1개를 골라 코드를 고치고, 고치기 전·후 화면을 비교해 보세요.',
  },
  {
    track: 'python', week: 4, session: 2, temperament: 'CHALLENGER', kind: 'tip',
    title: '한 번에 하나만 고치면 됩니다',
    body: '피드백을 다 반영하려 하면 아무것도 못 끝냅니다. 1개 고치고 실행해 확인하세요.\n그 1개가 다음 버전의 시작입니다.',
  },
];

/** 대회 시드 — 2026-11-26 기준, 공식·언론 보도로 확인한 일정만 넣었습니다. */
export const COMPETITION_SEED: CompetitionSeedRow[] = [
  {
    seed_key: 'comp-ai-oneeum-2026',
    title: 'AI 온이음 드림(DREAM) 챌린지',
    host: '한국장학재단 · 교육부',
    target: 'all',
    start_date: '2026-11-24',
    end_date: '2026-12-31',
    event_date: '2027-02-04',
    url: 'https://dream-challenge.baze.cloud',
    summary:
      '일상에서 겪은 문제를 AI로 해결하는 출품작 공모. AI 에이전트·AI 웹앱 두 부문, 개인 또는 같은 학교 5명 이하 팀. 12/31까지 접수 → 1/11 본선 12팀 발표 → 2/4 본선. 총상금 3천만원, 교육부 장관상 포함.',
    sort_no: 10,
  },
  {
    seed_key: 'comp-saaskr-game-2026',
    title: '2026 saaskr 게임 어워드 (AI 웹게임)',
    host: 'saaskr',
    target: 'all',
    start_date: '2026-10-21',
    end_date: '2026-12-20',
    event_date: '2026-12-31',
    url: 'https://game.saaskr.com/awards',
    summary:
      'AI·바이브코딩으로 만든 웹게임 공모. 브라우저에서 바로 플레이되는 게임이면 되고, 닉네임만 등록합니다. 12/20까지 후보 공개 → 결선 투표 12/31 → 1월 둘째 주 발표. 수상 확인서(QR 진위확인) 발급.',
    sort_no: 20,
  },
  {
    seed_key: 'comp-cospro-82',
    title: 'COS Pro 코딩전문가자격시험 제82회',
    host: 'YBM',
    target: 'all',
    start_date: '2026-10-19',
    end_date: '2026-12-17',
    event_date: '2026-12-19',
    url: 'https://www.ybmit.com',
    summary:
      '파이썬을 포함한 실기 시험(1~3급). 접수 12/17까지, 시험 12/19 14:00. 응시료 3만~4만5천원. 배운 문법을 자격으로 남기고 싶은 학생에게 좋습니다. 급수·시험장은 접수처에서 확인.',
    sort_no: 30,
  },
  {
    seed_key: 'comp-cospro-83',
    title: 'COS Pro 코딩전문가자격시험 제83회',
    host: 'YBM',
    target: 'all',
    start_date: '2026-11-23',
    end_date: '2027-01-21',
    event_date: '2027-01-23',
    url: 'https://www.ybmit.com',
    summary:
      '파이썬 실기 1~3급. 접수 2027-01-21까지, 시험 2027-01-23 14:00. 겨울방학 동안 준비해 1월에 응시하기 좋은 일정입니다.',
    sort_no: 40,
  },
  {
    seed_key: 'comp-cos-91',
    title: 'COS 코딩활용능력시험 제91회',
    host: 'YBM',
    target: 'all',
    start_date: '2026-11-09',
    end_date: '2027-01-07',
    event_date: '2027-01-09',
    url: 'https://www.ybmit.com',
    summary:
      '스크래치·엔트리 블록 코딩 실기 1~4급. 접수 2027-01-07까지, 시험 2027-01-09 14:00. 응시료 2만~2만5천원. 초등 저학년이 첫 자격으로 도전하기 좋습니다.',
    sort_no: 50,
  },
  {
    seed_key: 'comp-delightex-6',
    title: '제6회 Delightex 3D 창작·코딩 공모전',
    host: '헬로소프트',
    target: 'all',
    start_date: '2026-11-14',
    end_date: '2026-11-29',
    event_date: '2026-12-08',
    url: 'https://www.brainjoy.kr/coding-contests',
    summary:
      'AI 캐릭터와 상호작용하는 3D 작품을 블록 코딩으로 구현하는 공모전. 3D 작품 공유 링크와 60~90초 시연 영상을 제출. 11/29 24:00 마감, 결과 12/8. 전국 초·중·고 개인 1작품.',
    sort_no: 5,
  },
  {
    seed_key: 'comp-koi-2027',
    title: '한국정보올림피아드(KOI) 2027',
    host: '한국정보올림피아드',
    target: 'all',
    start_date: null,
    end_date: null,
    event_date: null,
    url: 'https://koi.or.kr',
    summary:
      '2026년은 1차 접수 4/13~4/29(대회 5/10), 2차 접수 6/26~7/12(대회 7/18)였습니다. 2027년 일정은 보통 4월 접수·5월 1차 대회로 공지됩니다. 공식 공지가 나오면 원장이 이 카드에 날짜를 채워 넣습니다.',
    sort_no: 60,
  },
  {
    seed_key: 'comp-usaco-2027',
    title: 'USACO (미국 정보올림피아드) 온라인 4회',
    host: 'USACO',
    target: 'all',
    start_date: null,
    end_date: null,
    event_date: null,
    url: 'https://usaco.org',
    summary:
      '12월·1월·2월 온라인 대회 + 3월 US Open. 무료이고 국적·학년 제한이 없어 파이썬 심화 학생이 도전하기 좋습니다. 2026-27 공식 일정은 11월 26일 기준 아직 게시되지 않아 날짜는 비워 두었습니다.',
    sort_no: 70,
  },
];

/** IT뉴스 시드 — 2026-11-15 이후 실제 보도만. */
export const NEWS_SEED: NewsSeedRow[] = [
  {
    seed_key: 'news-yna-20261124-ai-challenge',
    title: "일상 속 문제 AI로 푼다…장학재단·교육부 'AI 온이음 드림 챌린지'",
    source: '연합뉴스',
    url: 'https://www.yna.co.kr/view/AKR20261124125900530',
    summary:
      '한국장학재단과 교육부가 학생이 겪은 문제를 AI로 해결하는 경진대회를 엽니다. AI 에이전트·AI 웹앱 두 부문, 12/31까지 접수, 총상금 3천만원. 우리 학원 추천기·웹앱 수업이 그대로 출품작이 될 수 있습니다.',
    tag: '대회',
    published_at: '2026-11-24',
    sort_no: 10,
  },
  {
    seed_key: 'news-jnilbo-20261125-gwangju-ai',
    title: "코딩부터 앱 개발까지…광주 학생들 AI 역량 키웠다",
    source: '전남일보',
    url: 'https://www.jnilbo.com/news/articleView.html?idxno=90000086189',
    summary:
      '광주 AI교육원 영재교육원 초·중학생 180명이 1년 100차시 과정을 수료하고 프로젝트 발표회를 열었습니다. 초등은 엔트리·마이크로비트, 중등은 게임·앱 개발까지 직접 기획해 시연했습니다.',
    tag: 'AI교육',
    published_at: '2026-11-25',
    sort_no: 20,
  },
  {
    seed_key: 'news-yna-20261124-coscom',
    title: '코스콤, 안양시 초등학생 대상 코딩·AI 활용 교육 성료',
    source: '연합뉴스',
    url: 'https://www.yna.co.kr/view/AKR20261124084900008',
    summary:
      '코스콤이 두 달간 안양 초등 고학년에게 코딩·자율주행 로봇·AI 콘텐츠 제작·디지털 윤리를 가르치고 성과공유회를 열었습니다. 학생들이 직접 만든 창작물을 발표하는 방식이 인상적입니다.',
    tag: '코딩교육',
    published_at: '2026-11-24',
    sort_no: 30,
  },
  {
    seed_key: 'news-mk-20261123-codiny',
    title: 'KT AI 코디니, 블록코딩 넘어 피지컬 AI 교육까지 확대',
    source: '매일경제',
    url: 'https://www.mk.co.kr/news/special-edition/12216241',
    summary:
      'KT가 블록코딩 플랫폼 AI 코디니에 로봇·IoT 교구 연동을 더하고, 내년에는 실제 교구로 제어까지 경험하는 피지컬 AI로 넓힙니다. AI 코디니 기반 AICE Future 응시자는 이미 1만명을 넘었습니다.',
    tag: 'AI교육',
    published_at: '2026-11-23',
    sort_no: 40,
  },
  {
    seed_key: 'news-kma-20261117-aidonghaeng',
    title: 'AI동행 프로젝트 초등 데이터AI, 데모데이로 마무리',
    source: '한국능률협회',
    url: 'https://www.kma.or.kr',
    summary:
      '과학기술정보통신부·한국과학창의재단의 AI동행 프로젝트에서 전국 초등 214명이 학교·동네 문제를 데이터와 AI로 풀었습니다. "AI가 제안해도 결정은 우리가"라는 학생 소감이 눈에 띕니다.',
    tag: 'AI교육',
    published_at: '2026-11-17',
    sort_no: 50,
  },
];
