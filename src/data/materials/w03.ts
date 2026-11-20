import type { MaterialSeedRow } from '../materialTypes';

/**
 * 3주차 — 조건문 (갈림길)
 * 1회차: if/elif/else로 나이별 요금 안내 + 경계값
 * 2회차: 순서 논리 오류 잡기 + and/or로 등급 계산기
 */

const W3S1_ANSWER = `age = int(input("나이: "))

if age < 8:
    print("유아 요금: 무료")
elif age < 14:
    print("어린이 요금: 3,000원")
elif age < 20:
    print("청소년 요금: 5,000원")
else:
    print("성인 요금: 8,000원")`;

const W3S2_ANSWER = `score = int(input("점수: "))
attend = int(input("출석률(%): "))

if score < 0 or score > 100:
    print("0~100 사이로 다시 입력해 주세요.")
else:
    if score >= 90:
        grade = "A"
    elif score >= 80:
        grade = "B"
    elif score >= 70:
        grade = "C"
    else:
        grade = "D"

    print(f"{score}점 → {grade}등급")

    if grade in ("A", "B") and attend >= 80:
        print("수료증 발급 대상입니다.")
    else:
        print(f"다음 주에 한 번 더 도전해 보세요. (수료증까지 {90 - score}점)")`;

export const W03: MaterialSeedRow[] = [
  /* ================================================================ 3주 1회차 */
  {
    key: 'py-w03-s1',
    kind: 'theory',
    title: 'if로 나이별 요금 안내 만들기 (2시간)',
    track: 'python',
    week: 3,
    session: 1,
    summary: 'if/elif/else로 갈림길을 만들고, 경계값을 직접 실행해 확인합니다.',
    sort: 10,
    published: true,
    student: {
      goal: '나이를 넣으면 유아·어린이·청소년·성인 요금 중 하나가 나오고, 경계값에서 결과가 바뀌는 것을 확인한다',
      preview: `나이: 13
어린이 요금: 3,000원`,
      words: ['조건', 'if', 'elif / else', '들여쓰기'],
      conceptTitle: '조건문은 갈림길 표지판',
      concept: [
        { code: 'if 조건:', mean: '조건이 True일 때 아래(들여쓰기)를 실행' },
        { code: 'elif 다른 조건:', mean: '위가 아니고 이게 True일 때' },
        { code: 'else:', mean: '위가 전부 아닐 때' },
        { code: ':', mean: '조건 줄 끝에 반드시 콜론' },
        { code: '들여쓰기 4칸', mean: '이게 없으면 조건문이 아니다' },
        { code: '= vs ==', mean: '= 는 넣기, == 는 같은지 물어보기' },
        { code: 'age < 14', mean: '14보다 작을 때(14는 포함하지 않음)' },
      ],
      predict: {
        code: 'age = 14\n\nif age >= 20:\n    print("성인")\nelif age >= 13:\n    print("청소년")\nelse:\n    print("어린이")',
        answer: '청소년 — 첫 줄이 False라서 둘째 줄에서 걸립니다',
      },
      steps: [
        { title: '1단계 — 나이 받기', code: 'age = int(input("나이: "))' },
        { title: '2단계 — 갈래 2개 (기초)', code: 'if age < 20:\n    print("청소년 이하")\nelse:\n    print("성인")' },
        { title: '3단계 — 갈래 3개', code: 'if age < 8:\n    print("유아 요금: 무료")\nelif age < 14:\n    print("어린이 요금: 3,000원")\nelse:\n    print("청소년 또는 성인")' },
        { title: '4단계 — 갈래 4개 (오늘의 완성)', code: 'elif age < 20:\n    print("청소년 요금: 5,000원")\nelse:\n    print("성인 요금: 8,000원")' },
        { title: '5단계 — 경계값 5번 실행', note: '6, 10, 13, 15, 20을 넣어 결과가 바뀌는 곳을 찾으세요. 바로 그 숫자가 경계값입니다.' },
      ],
      builds: [
        {
          label: '기초',
          title: '① 하나의 if — 성인인가?',
          intro: '조건문의 생김새부터. if·콜론·들여쓰기 세 가지를 몸에 익힙니다.',
          steps: [
            { title: '코드', code: 'age = int(input("나이: "))\n\nif age >= 20:\n    print("성인입니다")\nelse:\n    print("성인이 아닙니다")' },
          ],
          out: '나이: 21\n성인입니다',
        },
        {
          label: '변형',
          title: '② 세 갈래로 늘리기',
          intro: 'elif를 붙이면 갈래가 늘어납니다. 순서가 중요하다는 것도 여기서 처음 봅니다.',
          steps: [
            {
              title: '코드',
              code: 'age = int(input("나이: "))\n\nif age < 8:\n    print("유아: 무료")\nelif age < 20:\n    print("학생: 5,000원")\nelse:\n    print("성인: 8,000원")',
            },
          ],
          out: '나이: 15\n학생: 5,000원',
        },
        {
          label: '실전',
          title: '③ 요금표 네 갈래 (오늘의 완성)',
          intro: '경계를 8 / 14 / 20으로 잡습니다. 경계값을 직접 넣어 확인하는 것이 진짜 실력.',
          steps: [
            {
              title: '코드',
              code: 'age = int(input("나이: "))\n\nif age < 8:\n    print("유아 요금: 무료")\nelif age < 14:\n    print("어린이 요금: 3,000원")\nelif age < 20:\n    print("청소년 요금: 5,000원")\nelse:\n    print("성인 요금: 8,000원")',
            },
            { title: '확인', note: '7 → 무료 / 8 → 어린이 / 13 → 어린이 / 14 → 청소년 / 20 → 성인. 다섯 번 실행해 표를 채우세요.' },
          ],
          out: '나이: 8\n어린이 요금: 3,000원',
        },
      ],
      practice: [
        {
          title: '실습 1 — 짝수와 홀수',
          prompt: '숫자를 넣으면 짝수인지 홀수인지 출력하세요.',
          starter: 'n = int(input("숫자: "))\n# 나머지 % 2 를 이용해 if를 완성',
          expect: '숫자: 7\n7은 홀수입니다',
          hint: 'n % 2 == 0 이면 짝수. 아니면 홀수.',
        },
        {
          title: '실습 2 — 60점 합격',
          prompt: '점수를 넣으면 합격/불합격을 출력하세요. 60점도 합격입니다.',
          starter: 'score = int(input("점수: "))\n# if 한 줄을 채우세요',
          expect: '점수: 60\n합격입니다',
          hint: 'score >= 60 이면 합격. = 를 하나만 쓰면 SyntaxError.',
        },
        {
          title: '실습 3 — 경계값 맞히기',
          prompt: '아래 코드에 13, 14를 넣으면 각각 무엇이 나올지 먼저 적고 실행하세요.',
          starter: 'age = 13\nif age < 14:\n    print("어린이")\nelse:\n    print("청소년")',
          expect: '13 → 어린이 / 14 → 청소년',
        },
        {
          title: '실습 4 — = 와 == 구분',
          prompt: '두 코드 중 실행되는 것과 오류가 나는 것을 구분하고, 이유를 적으세요.',
          starter: 'a = 13\nprint(a == 13)\n# print(a = 13)  ← 이 줄의 주석을 풀면?',
          expect: 'True\nSyntaxError — = 는 넣기, == 는 비교',
        },
      ],
      mistakes: [
        { symptom: 'IndentationError', cause: '들여쓰기 4칸이 아니거나 탭·스페이스가 섞임' },
        { symptom: "SyntaxError: expected ':'", cause: '콜론 누락' },
        { symptom: 'if age = 13 에서 SyntaxError', cause: '비교는 ==' },
        { symptom: '조건이 맞는데 아무것도 안 나온다', cause: 'print가 if 블록 밖으로 나갔거나 들여쓰기가 어긋남' },
      ],
      hints: ['조건 줄 끝에 콜론이 있는지 봐요.', '들여쓰기를 지우면 무슨 일이 나는지 직접 확인해 보세요.', '물어볼 땐 ==, 넣을 땐 =', '경계값(8, 14, 20)을 직접 넣어 보면 어디가 틀렸는지 보여요.'],
      selfcheck: [
        '경계값 8·14·20에서 결과가 바뀌는 걸 확인했다',
        '= 와 == 의 차이를 예로 말할 수 있다',
        '들여쓰기를 지웠을 때 나는 에러를 봤다',
        '내 요금표로 바꿔 3번 실행했다',
      ],
    },
    teacher: {
      demo: "'지금까지는 위에서 아래로 한 줄씩만 갔습니다. 오늘부터 컴퓨터가 생각합니다. 나이를 넣으면 네 갈래 중 하나로 갈라져요. 오늘의 핵심은 순서와 경계값입니다.'",
      analogy:
        '조건문은 갈림길 표지판 — 처음 표지판이 맞으면 그 길로 가고 다른 길은 쳐다보지 않는다. 그래서 순서가 중요합니다. 경계값은 "문턱" — 8살은 어린이 쪽, 7살은 유아 쪽.',
      timeline: [
        { min: '0~10', title: '도입 — 갈림길이 필요한 순간', detail: '지난 주 계산기에서 거스름돈이 마이너스로 나온 화면을 띄우고 "프로그램이 상황을 판단하게 하려면?"으로 시작.' },
        { min: '10~30', title: '개념 — if·콜론·들여쓰기', detail: '판서로 분기 그림 3갈래. if/elif/else를 한 줄씩. 들여쓰기를 일부러 지워 IndentationError를 다 같이 봅니다.' },
        { min: '30~50', title: '따라 만들기 ① 성인인가', detail: '가장 작은 if. 전원 실행 확인. 콜론·들여쓰기 오류를 그 자리에서 잡습니다.' },
        { min: '50~70', title: '따라 만들기 ② 세 갈래', detail: 'elif 추가. "위가 아니고"를 소리 내어 읽게 합니다.' },
        { min: '70~95', title: '③ 네 갈래 + 경계값 표', detail: '7·8·13·14·20을 넣어 결과 표를 채웁니다. 표가 채워지면 조건문을 이해한 것입니다.' },
        { min: '95~110', title: '미니 실습 1~4', detail: '1번(짝수/홀수) 전원, 2번(60점) 전원, 3번(경계값 예상) 설명까지, 4번(= vs ==)은 오류를 직접 만나게.' },
        { min: '110~117', title: 'AI + 정리', detail: 'AI에게 "우리 반 요금 기준에서 결과가 이상해지는 나이 5개만" 받아 직접 실행해 확인.' },
        { min: '117~120', title: '저장·예고', detail: '저장 후 다음 시간 예고: "오늘 코드의 순서를 일부러 뒤집으면 어떻게 될까요? 다음 시간에 조용한 버그로 만납니다."' },
      ],
      board: [
        { say: '오늘부턴 갈라집니다', write: '분기 그림 3갈래' },
        { say: 'if = 만약 ~라면', write: 'if age < 8:' },
        { say: '콜론과 들여쓰기', write: '4칸 상자 그려서 "이 안에 있어야 실행"' },
        { say: 'elif = 위가 아니고', write: '위에서부터 화살표' },
        { say: 'else = 나머지 전부', write: '마지막 갈래' },
        { say: '== 질문, = 넣기', write: 'age = 13 vs age == 13' },
        { say: '경계값 표', write: '7 · 8 · 13 · 14 · 20' },
        { say: '함정', write: '들여쓰기 지워 IndentationError 즉석 시연' },
      ],
      ai: [
        { when: '35~45분', what: '갈래 기준 질문 2개', prompt: '중학생 요금 기준을 4단계로 나눈다면 경계를 어디로 두면 좋을까? 근거만 2줄.', rule: '기준은 학생이 정하고 근거만 참고' },
        { when: '110분', what: '경계값 점검', prompt: '내 요금 기준: 8 미만 무료, 14 미만 3000원, 20 미만 5000원, 나머지 8000원. 결과가 이상해지는 나이 5개만 알려줘.', rule: '받은 나이를 직접 실행해 확인한 것만 인정' },
      ],
      errors: [
        { symptom: 'IndentationError', cause: '공백/탭 혼용', coach: '4칸 스페이스로 통일. 탭은 쓰지 않기.' },
        { symptom: "expected ':'", cause: '콜론', coach: '조건 줄 끝엔 항상 콜론.' },
        { symptom: '모두 else만 실행', cause: 'int() 누락 → 문자열 비교', coach: '숫자 비교인지 글자 비교인지 확인.' },
        { symptom: '경계에서 한 칸씩 어긋남', cause: '< 와 <= 선택', coach: '"14살은 어린이? 청소년?"을 말로 정하고 기호를 고르게.' },
        { symptom: 'print가 두 번 나옴', cause: '들여쓰기 위치', coach: 'if 블록 안/밖을 상자 그림으로 표시.' },
      ],
      qa: [
        { q: 'elif를 if로 또 쓰면 안 되나요?', a: '쓸 수는 있지만 그러면 앞 조건과 상관없이 각각 판단합니다. "위가 아니고"의 뜻이 필요할 때 elif.' },
        { q: '14살이 왜 청소년이에요? 어린이 아닌가요?', a: 'age < 14 이므로 14는 어린이가 아닙니다. 경계값을 말로 정하고 기호를 고르게 하세요 — 이게 경계값 사고입니다.' },
        { q: '들여쓰기를 스페이스로 몇 칸?', a: '4칸으로 통일합니다. 탭과 스페이스를 섞으면 IndentationError가 납니다.' },
        { q: '조건이 맞는데 결과가 안 나와요', a: 'print가 if 블록 안에 있는지 확인. 상자 그림(들여쓰기)을 그려 보게 하세요.' },
        { q: 'and는 언제 배워요?', a: '다음 시간(2회차)에 바로 배웁니다. 오늘은 한 조건씩만.' },
      ],
      tips: [
        '예측 정답은 청소년. if age >= 13 을 위로 올리면 20도 청소년이 됩니다 — 2회차 논리 오류 재료.',
        '경계값 표를 칠판에 그려 두고 학생이 실행 결과를 채우게 하면 5분 만에 이해도가 드러납니다.',
        '들여쓰기 오류는 반드시 한 번 다 같이 겪게 하세요. 글로 설명하는 것보다 10배 빠릅니다.',
      ],
    },
    answer: W3S1_ANSWER,
    aiTip: '갈래 기준을 정할 때 "근거만 2줄"로 물어보세요. 기준을 정하는 건 내가!',
  },

  /* ================================================================ 3주 2회차 */
  {
    key: 'py-w03-s2',
    kind: 'theory',
    title: '3주 2회차 — 조건 순서 잡고 등급 계산기 (2시간)',
    track: 'python',
    week: 3,
    session: 2,
    summary: '순서 논리 오류를 잡고 and/or로 등급 계산기를 완성합니다. 오류가 안 나는 버그를 찾는 수업.',
    sort: 20,
    published: true,
    student: {
      goal: '에러가 안 나는데 답이 틀리는 코드를 고치고, and/or로 등급 계산기를 완성한다',
      preview: `점수: 85
출석률(%): 90
85점 → B등급
수료증 발급 대상입니다.`,
      words: ['논리 오류', 'and / or', '범위 검사'],
      conceptTitle: '표지판은 위에서부터, 한 번만',
      concept: [
        { code: 'if score >= 60: ...\nelif score >= 80: ...', mean: '85점은 첫 줄에서 이미 True → 뒤는 보지 않는다' },
        { code: 'A and B', mean: '둘 다 맞아야 True' },
        { code: 'A or B', mean: '하나만 맞아도 True' },
        { code: 'not A', mean: '뒤집기' },
        { code: 'score < 0 or score > 100', mean: '범위 밖 입력 막기' },
        { code: 'grade in ("A", "B")', mean: '여러 값 중 하나인지 확인' },
      ],
      predict: {
        code: 'score = 85\nif score >= 60:\n    print("B")\nelif score >= 80:\n    print("A")',
        answer: 'B — 첫 줄이 True라서 elif는 아예 보지 않습니다',
      },
      steps: [
        { title: '오늘 할 일', note: '① 요금 안내 마무리 ② 조용한 논리 오류 잡기 ③ 등급 계산기 완성 ④ 미션' },
        { title: '순서가 결과를 바꾼다 — 왜 다 B가 나올까?', code: 'if score >= 60:\n    grade = "B"\nelif score >= 80:\n    grade = "A"' },
        { title: '고치는 두 방법', note: '① 큰 수(좁은 문)를 먼저 ② >= 대신 < 로 뒤집어 쓰기' },
        {
          title: '등급 계산기 뼈대 — 빈칸 채우기',
          code: 'score = int(input("점수: "))\nattend = int(input("출석률(%): "))\n\nif score >= 90:\n    grade = "A"\nelif score >= 80:\n    grade = "B"\nelif score >= 70:\n    grade = "C"\nelse:\n    grade = "D"\n\nprint(f"{score}점 → {grade}등급")\n\nif ______ and ______:\n    print("수료증 발급 대상입니다.")\nelse:\n    print("다음 주에 한 번 더 도전해 보세요.")',
        },
      ],
      debug: [
        {
          kind: '문법',
          title: '문제 A — elif 뒤에 나온 else',
          code: 'score = int(input("점수: "))\n\nif score >= 90:\n    grade = "A"\nelse:\n    grade = "D"\nelif score >= 80:\n    grade = "B"\n\nprint(grade)',
          symptom: "SyntaxError: invalid syntax (elif 줄)",
          check: '90·85·75·65를 넣으면 A·B·C·D가 차례대로 나온다.',
          hint: 'else는 조건문의 마지막입니다. else 아래에 elif를 둘 수 없습니다. 순서를 큰 수부터 다시 세워 보세요.',
        },
        {
          kind: '실행',
          title: '문제 B — 점수가 글자로 들어온 코드',
          code: 'score = input("점수: ")\nattend = int(input("출석률(%): "))\n\nif score >= 90:\n    grade = "A"\nelse:\n    grade = "D"',
          symptom: "TypeError: '>=' not supported between instances of 'str' and 'int'",
          check: '점수 95를 넣으면 A가 나온다.',
          hint: 'input은 글자를 줍니다. 비교하려면 int()가 필요합니다.',
        },
        {
          kind: '논리',
          title: '문제 C — 조용한 순서 버그',
          code: 'score = 85\n\nif score >= 70:\n    grade = "C"\nelif score >= 80:\n    grade = "B"\nelif score >= 90:\n    grade = "A"\nelse:\n    grade = "D"\n\nprint(f"{score}점 → {grade}등급")',
          symptom: '오류 없이 "85점 → C등급" — 85는 B여야 한다',
          check: '85 → B, 95 → A, 75 → C, 65 → D',
          hint: '조건을 위에서부터 읽어 보세요. 85는 첫 줄 70 이상에서 이미 걸립니다. 좁은 문을 위로 올리세요.',
        },
      ],
      practice: [
        {
          title: '확인 1 — and 인가 or 인가',
          prompt: '수료증 조건 "A 또는 B이면서 출석 80 이상"을 코드로 옮기세요.',
          starter: 'grade = "B"\nattend = 75\nif ______:\n    print("수료증 대상")\nelse:\n    print("다음 기회에")',
          expect: '다음 기회에',
          hint: 'grade in ("A", "B") and attend >= 80 — 둘 다 맞아야 하므로 and.',
        },
        {
          title: '확인 2 — 범위 검사',
          prompt: '0~100 밖의 점수를 막는 조건을 맨 위에 넣으세요.',
          starter: 'score = 105\n# 맨 위에 범위 검사 if를 넣고, 아래는 else 안으로 들여쓰기',
          expect: '0~100 사이로 다시 입력해 주세요.',
          hint: 'if score < 0 or score > 100: — 둘 중 하나만 맞아도 막아야 하므로 or.',
        },
      ],
      mistakes: [
        { symptom: '조건을 뒤집었더니 등급이 다 틀림', cause: '넓은 조건을 위에 두면 뒤가 굶는다' },
        { symptom: '수료증이 항상 나온다', cause: 'and 대신 or / 괄호 오류' },
        { symptom: '105점도 A', cause: '범위 검사가 없다' },
        { symptom: 'else 아래 elif를 써서 SyntaxError', cause: 'else는 마지막' },
      ],
      hints: [
        '85를 넣으면 첫 줄이 True인지 확인해 보세요.',
        '표지판은 위에서부터, 한 번만 지나갑니다.',
        '범위 검사는 맨 위에 score < 0 or score > 100',
        'and는 둘 다, or는 하나만 — 말로 읽어 보면 대부분 잡혀요.',
      ],
      selfcheck: [
        '85·90·0·105를 넣어 모두 확인했다',
        '순서를 바꿨을 때 왜 틀리는지 말로 설명할 수 있다',
        'and 가 무슨 뜻인지 예로 들 수 있다',
        '미션 1개 이상 붙였다',
      ],
      missions: {
        basic: '점수는 맞는데 출석률이 80 미만이면 "출석이 조금 아쉬워요" 문구로 나눠 출력하기',
        challenge: '범위 검사(0~100)를 넣어 105점·-5점에 안내 문구가 나오게 하기',
        deep: '등급마다 다른 격려 문구를 붙이고, 수료증까지 몇 점 남았는지 계산해 출력하기 — {90 - score}',
      },
      missionsOut: {
        basic: '85점 → B등급\n수료증은 출석 80%부터예요. 지금 70%',
        challenge: '점수: 105\n0~100 사이로 다시 입력해 주세요.',
        deep: '85점 → B등급\n다음 주에 한 번 더 도전해 보세요. (수료증까지 5점)',
      },
    },
    teacher: {
      demo: "'오늘 제일 중요한 순간입니다. 빨간 글씨가 안 뜨는데 답이 틀린 코드를 보여 줄 거예요. 이걸 잡으면 진짜로 아는 겁니다. 오늘 두 시간은 조용한 버그 사냥입니다.'",
      analogy:
        '조건문은 한 번 지나가면 다시 안 돌아옵니다. 넓은 문을 위에 두면 뒤가 굶어 죽어요 — 좁은 문을 위에, 넓은 문을 아래에. and는 "두 자물쇠", or는 "둘 중 하나만 열려도 되는 문".',
      timeline: [
        { min: '0~10', title: '도입 — 지난 시간 코드 점검', detail: '3주 1회차 요금 안내를 연다. 경계값 5개를 다시 넣어 보고, 순서를 뒤집으면 어떻게 되는지 예고.' },
        { min: '10~25', title: '개념 — 순서와 and/or', detail: '85점 코드를 판서로 한 줄씩. "첫 줄에서 걸리면 뒤는 안 본다"를 화살표로. and/or 진리표 4칸.' },
        { min: '25~60', title: '디버깅 A·B·C', detail: 'A(문법: else 뒤 elif)·B(실행: int 누락)·C(논리: 순서). C는 결과를 나란히 띄워 "85 → C"를 보고 스스로 이상함을 느끼게. 모둠 순환 15분씩.' },
        { min: '60~85', title: '등급 계산기 완성', detail: '빈칸 채우기 → 내 점수로 실행 → 4개 점수 검증(95·85·75·65). 여기까지가 필수.' },
        { min: '85~105', title: '미션 3단계', detail: '기본(출석 문구)·도전(범위 검사)·심화(격려·남은 점수). 각 예시 출력과 비교하게 합니다.' },
        { min: '105~114', title: 'AI로 반례 찾기', detail: '"결과가 이상해지는 입력 5개만" 받아 직접 실행. AI 답을 그대로 믿지 않고 실행으로 확인하는 습관.' },
        { min: '114~118', title: '저장·발표', detail: '내가 고친 조용한 버그 1개를 30초로 설명. 못 하면 코드의 그 줄을 읽게.' },
        { min: '118~120', title: '예고', detail: '다음 주는 4주 미니 프로젝트. "오늘 배운 조건문으로 추천기를 만듭니다."' },
      ],
      board: [
        { say: '3주 1회차 코드 열기, 내 나이 기준으로 바꿨는지', write: '완성/미완성 체크' },
        { say: '순서 뒤집힌 코드를 같이 실행', write: '85점 → B / A가 안 나오는 이유 화살표' },
        { say: '고치는 두 방법', write: '① 큰 수 먼저 ② < 로 뒤집기' },
        { say: 'and / or 표', write: '진리표 4칸 (두 자물쇠 / 한 문)' },
        { say: '등급 표', write: '90 / 80 / 70 / 나머지' },
        { say: '범위 검사', write: 'score < 0 or score > 100 맨 위' },
        { say: '조용한 버그 찾는 3단계', write: '① 결과 읽기 ② 기대값 적기 ③ 조건 순서 보기' },
        { say: '업그레이드', write: '기본 / 도전 / 심화 + 예시 출력' },
      ],
      ai: [
        { when: '70~85분', what: '조건문 구멍(반례) 찾기', prompt: '내 등급 기준: 90 이상 A, 80 이상 B, 70 이상 C, 나머지 D, 점수는 0~100. 이 기준에서 결과가 이상해지는 입력 5개만 알려줘. 코드는 쓰지 마.', rule: '받은 입력을 직접 실행해 확인한 것만 인정' },
        { when: '105분', what: '내 디버깅 설명 검사', prompt: "내 설명: '85가 첫 번째 if에서 걸려서 C가 나왔어요. 그래서 큰 수를 위로 올렸어요.' 틀린 부분만 짚어줘.", rule: '설명 검사만, 코드 재작성 금지' },
      ],
      errors: [
        { symptom: '전부 같은 등급', cause: '조건 순서', coach: '위에서 한 번 맞으면 끝 — 좁은 문을 위로.' },
        { symptom: '수료증이 항상 나옴', cause: 'and/or 혼동', coach: '둘 다 맞아야 한다면 and. 소리 내어 읽어 보게.' },
        { symptom: '105점도 A', cause: '범위 검사 없음', coach: '도전 미션으로 승격.' },
        { symptom: 'elif에서 SyntaxError', cause: 'else 뒤에 elif', coach: 'else는 마지막. 순서를 큰 수부터 다시.' },
        { symptom: '들여쓰기 때문에 else가 따로 동작', cause: 'if와 else의 짝', coach: '세로줄을 맞춰 어느 if의 else인지 표시.' },
      ],
      qa: [
        { q: '왜 85가 B가 아니라 C예요?', a: '첫 조건이 70 이상이라 85가 거기서 걸립니다. 표지판 비유로 돌아가 "먼저 만나는 표지판이 이긴다"를 확인.' },
        { q: 'and와 or를 자꾸 바꿔 써요', a: '"둘 다 필요하면 and, 하나만 필요하면 or"를 문장으로 읽게 하세요. 수료증은 둘 다 필요 → and.' },
        { q: '범위 검사를 왜 맨 위에 두나요?', a: '아래에 두면 105가 A로 먼저 처리됩니다. 막는 문은 입구에 세운다.' },
        { q: 'if를 두 개 쓰면 안 되나요?', a: '됩니다. 다만 서로 영향을 주지 않아서 순서 실수를 찾기 어려워집니다. 오늘은 elif로 "한 갈래만"을 연습.' },
        { q: '수료증까지 몇 점 남았는지 어떻게 계산해요?', a: '90 - score. 85면 5점. 심화 미션에서 f-string 안에 식을 바로 넣어 봅니다.' },
      ],
      tips: [
        'C(논리 오류)는 모둠별로 서로 다른 순서 오류를 주고 바꿔 고치게 하면 15분이면 정리됩니다.',
        '조용한 버그는 "기대값을 먼저 적기"로 잡습니다. 실행 전에 정답을 종이에 쓰게 하세요.',
        'AI 반례를 받으면 반드시 직접 실행해 확인 — 이 습관을 오늘 한 번 각인시킵니다.',
      ],
    },
    answer: W3S2_ANSWER,
    aiTip: '"내 기준에서 결과가 이상해지는 입력 5개만 알려줘. 코드는 쓰지 마." — 받은 입력은 꼭 직접 실행해 확인!',
  },
];
