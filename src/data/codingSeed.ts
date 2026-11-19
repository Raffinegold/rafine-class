import type { CodingProblem } from '../types';

/**
 * 💻 코딩 커리큘럼 시드 — 라피네코딩컴퓨터학원 두정점 실제 수업 순서를 따릅니다.
 *
 * C1 블록·기초   : 스크래치 · 순서도 논리
 * C2 파이썬 기초 : 변수 · if · for · 리스트 · 문자열
 * C3 C언어       : printf/scanf · 중첩 for · 배열 · 조건문
 * C4 유니티 C#   : Start/Update · Vector3/Transform · GetComponent · 충돌
 *
 * 문제 종류(kind)
 *  - output : 코드 실행 결과를 4지선다로 맞히기 (오늘 미션 + 출력 스피드 퀴즈)
 *  - blank  : 코드의 ____ 를 채우기 (오늘 미션)
 *  - bug    : 4~6줄 중 오류가 있는 1줄 찾기 (버그 찾기 게임)
 *  - order  : 뒤섞인 4~5개 블록을 실행 순서대로 조립 (블록 순서 맞추기 게임)
 *
 * 모든 문제·해설은 수업용으로 직접 작성했습니다.
 */

export const CODING_WRONG_NOTE_CLEAR_BOX = 3;

export const CODING_PROBLEMS: CodingProblem[] = [
  /* ============================== C1 · 블록·기초 ============================== */
  {
    id: 'c1-01',
    level: 'C1',
    kind: 'output',
    topic: '블록 실행 순서',
    prompt: '아래 블록을 실행하면 화면에 무엇이 나올까요?',
    code: `[🟩 깃발 클릭했을 때]
   [🟪 "안녕!" 이라고 말하기]`,
    choices: ['안녕!', '깃발', '아무것도 안 나와요', '0'],
    answer: 0,
    explanation: '초록 깃발 블록은 시작 신호예요. 그 아래 블록이 위에서부터 차례로 실행돼서 "안녕!"이 나와요.',
  },
  {
    id: 'c1-02',
    level: 'C1',
    kind: 'output',
    topic: '반복 블록',
    prompt: '반복 블록을 실행하면 고양이는 몇 번 말할까요?',
    code: `[🟩 깃발 클릭했을 때]
   [🔁 3번 반복하기]
      [🟪 "야호" 라고 말하기]`,
    choices: ['1번', '2번', '3번', '끝없이'],
    answer: 2,
    explanation: '반복 블록 안에 있는 "야호"가 3번 실행돼요. 반복 안쪽 블록은 한 칸 들여쓰여 있어요.',
  },
  {
    id: 'c1-03',
    level: 'C1',
    kind: 'output',
    topic: '조건 블록',
    prompt: '점수가 12일 때 아래 블록의 결과는?',
    code: `[🟩 깃발 클릭했을 때]
   [🟧 점수를 12로 정하기]
   [❓ 만약 (점수 > 10) 이면]
      [🟪 "합격" 이라고 말하기]`,
    choices: ['합격', '불합격', '12', '아무것도 안 나와요'],
    answer: 0,
    explanation: '점수 12는 10보다 크니까 조건이 참이에요. 그래서 "합격"을 말해요.',
  },
  {
    id: 'c1-04',
    level: 'C1',
    kind: 'blank',
    topic: '반복 횟수 정하기',
    prompt: '"점프"를 5번 말하게 하려면 빈칸에 무엇이 들어갈까요?',
    code: `[🟩 깃발 클릭했을 때]
   [🔁 ( ____ )번 반복하기]
      [🟪 "점프" 라고 말하기]`,
    choices: ['5', '1', '10', '0'],
    answer: 0,
    explanation: '말하고 싶은 횟수만큼 반복 횟수를 정해요. 5번 말하려면 5를 넣어요.',
  },
  {
    id: 'c1-05',
    level: 'C1',
    kind: 'blank',
    topic: '조건 정하기',
    prompt: '비가 올 때만 우산을 쓰게 하려면 빈칸에 무엇이 들어갈까요?',
    code: `[🟩 깃발 클릭했을 때]
   [❓ 만약 ( ____ ) 이면]
      [🟪 "우산을 써요" 라고 말하기]`,
    choices: ['비가 오면', '해가 뜨면', '점심이면', '숫자 3이면'],
    answer: 0,
    explanation: '조건 칸에는 "무엇이 참일 때 실행할지"를 넣어요. 우산은 비가 올 때 쓰니까 <비가 오면>이에요.',
  },
  {
    id: 'c1-06',
    level: 'C1',
    kind: 'bug',
    topic: '무한 반복',
    prompt: '고양이가 "안녕"을 5번만 말해야 하는데, 한 줄이 잘못됐어요. 틀린 줄을 찾으세요.',
    lines: [`🟩 깃발 클릭했을 때`, `🔁 5번 반복하기`, `      🟪 "안녕" 이라고 말하기`, `🔁 영원히 반복하기`],
    answerLine: 3,
    explanation: '"영원히 반복하기"가 들어가서 멈추지 않아요. 5번 반복하려면 반복 블록이 하나만 있어야 해요.',
  },
  {
    id: 'c1-07',
    level: 'C1',
    kind: 'bug',
    topic: '순서도 순서',
    prompt: '점수를 말하기 전에 점수를 정해야 해요. 틀린 줄을 찾으세요.',
    lines: [`🟩 깃발 클릭했을 때`, `🟪 ("내 점수: " + 점수) 라고 말하기`, `🟧 점수를 0으로 정하기`],
    answerLine: 1,
    explanation: '블록은 위에서 아래로 실행돼요. 점수를 정하기 전에 말하면 빈 값이 나와요. 정하기 → 말하기 순서로 바꿔요.',
  },
  {
    id: 'c1-08',
    level: 'C1',
    kind: 'order',
    topic: '일상 순서도',
    prompt: '냉장고에서 우유를 마시는 순서도예요. 블록을 올바른 순서로 탭하세요.',
    blocks: ['냉장고 문을 연다', '우유를 꺼낸다', '컵에 우유를 따른다', '냉장고 문을 닫는다'],
    explanation: '순서도는 준비 → 실행 → 정리 순서로 흐른다. 문을 열고 → 꺼내고 → 따르고 → 닫아요.',
  },
  {
    id: 'c1-09',
    level: 'C1',
    kind: 'order',
    topic: '게임 시작 알고리즘',
    prompt: '"게임 시작" 알고리즘을 실행 순서대로 조립하세요.',
    blocks: ['🟩 깃발을 클릭한다', '🟪 "시작!" 이라고 말한다', '🔁 3번 반복: 10걸음 움직인다', '🟪 "끝!" 이라고 말한다'],
    explanation: '시작 신호 → 인사 → 움직이기 → 마무리 순서예요. 반복은 움직이는 부분만 감싸요.',
  },

  /* ============================== C2 · 파이썬 기초 ============================== */
  {
    id: 'c2-01',
    level: 'C2',
    kind: 'output',
    topic: 'print',
    prompt: '아래 파이썬 코드를 실행하면 화면에 무엇이 나올까요?',
    code: `print("안녕")
print(3 + 4)`,
    choices: ['안녕\\n7', '안녕 7', '7', '안녕\\n34'],
    answer: 0,
    explanation: 'print는 한 줄씩 출력해요. 3 + 4는 계산이 되어 7이 나옵니다. 그래서 첫 줄 "안녕", 둘째 줄 7이에요.',
  },
  {
    id: 'c2-02',
    level: 'C2',
    kind: 'output',
    topic: '변수 값 바꾸기',
    prompt: '마지막 print(a)는 무엇을 출력할까요?',
    code: `a = 3
b = 5
a = b
print(a)`,
    choices: ['3', '5', '8', '35'],
    answer: 1,
    explanation: 'a = b 는 "b의 값을 a에 넣는다"는 뜻이에요. 그래서 a는 5가 되고, 8처럼 더해지지 않아요.',
  },
  {
    id: 'c2-03',
    level: 'C2',
    kind: 'output',
    topic: 'for · range',
    prompt: '아래 코드의 출력 결과는?',
    code: `total = 0
for i in range(1, 4):
    total += i
print(total)`,
    choices: ['3', '6', '10', '4'],
    answer: 1,
    explanation: 'range(1, 4)는 1, 2, 3이에요(끝 값 4는 포함하지 않아요). 1+2+3 = 6이 출력돼요.',
  },
  {
    id: 'c2-04',
    level: 'C2',
    kind: 'output',
    topic: '리스트 · len',
    prompt: '아래 코드의 출력 결과는?',
    code: `fruits = ["사과", "바나나", "포도"]
print(fruits[1])
print(len(fruits))`,
    choices: ['사과\\n3', '바나나\\n3', '포도\\n2', '바나나\\n2'],
    answer: 1,
    explanation: '리스트 번호는 0부터 시작해요. fruits[1]은 두 번째인 "바나나"이고, len은 개수라서 3이에요.',
  },
  {
    id: 'c2-05',
    level: 'C2',
    kind: 'blank',
    topic: 'if · else',
    prompt: '점수가 80 이상이면 "통과"를 출력해야 해요. 빈칸에 들어갈 것은?',
    code: `score = 85
if score >= 80:
    ____("통과")
else:
    print("다시")`,
    choices: ['print', 'input', 'for', 'list'],
    answer: 0,
    explanation: '화면에 보여 주는 함수는 print예요. input은 입력을 받는 함수라서 출력되지 않아요.',
  },
  {
    id: 'c2-06',
    level: 'C2',
    kind: 'blank',
    topic: 'range 범위',
    prompt: '0부터 4까지 다섯 번 출력하려면 빈칸에 무엇이 들어갈까요?',
    code: `for i in range(____):
    print(i)`,
    choices: ['5', '4', '0, 4', '1, 5'],
    answer: 0,
    explanation: 'range(5)는 0, 1, 2, 3, 4 다섯 개예요. 끝 숫자는 포함되지 않는다는 점을 기억해요.',
  },
  {
    id: 'c2-07',
    level: 'C2',
    kind: 'bug',
    topic: 'if 콜론',
    prompt: '아래 코드는 실행되자마자 오류가 나요. 틀린 줄을 찾으세요.',
    lines: [`score = 90`, `if score > 80`, `    print("합격")`, `else:`, `    print("불합격")`],
    answerLine: 1,
    explanation: '파이썬의 if 문 끝에는 콜론(:)이 꼭 필요해요. if score > 80: 처럼 써야 해요.',
  },
  {
    id: 'c2-08',
    level: 'C2',
    kind: 'bug',
    topic: '들여쓰기',
    prompt: '리스트의 합이 6이 나와야 하는데 3이 나와요. 틀린 줄을 찾으세요.',
    lines: [`numbers = [1, 2, 3]`, `total = 0`, `for n in numbers:`, `total = total + n`, `print(total)`],
    answerLine: 3,
    explanation: 'for 문 안에서 반복하려면 네 칸 들여쓰기 해야 해요. 들여쓰기가 없으면 반복이 끝난 뒤 마지막 값만 더해져요.',
  },
  {
    id: 'c2-09',
    level: 'C2',
    kind: 'order',
    topic: '짝수·홀수 판별',
    prompt: '숫자를 입력받아 짝수·홀수를 알려 주는 프로그램이에요. 순서대로 조립하세요.',
    blocks: [
      'number = int(input("숫자: "))',
      'if number % 2 == 0:',
      '    print("짝수")',
      'else:',
      '    print("홀수")',
    ],
    explanation: '입력 → 조건 검사 → 참일 때 출력 → 거짓일 때 출력 순서예요. % 2 == 0 은 "2로 나눈 나머지가 0"이라는 뜻이에요.',
  },
  {
    id: 'c2-10',
    level: 'C2',
    kind: 'order',
    topic: '리스트 합계',
    prompt: '리스트 [2, 4, 6]의 합을 구하는 코드예요. 순서대로 조립하세요.',
    blocks: ['numbers = [2, 4, 6]', 'total = 0', 'for n in numbers:', '    total = total + n', 'print(total)'],
    explanation: '재료(리스트)를 만들고 → 합을 담을 그릇을 0으로 준비하고 → 반복하며 더하고 → 마지막에 출력해요.',
  },

  /* ============================== C3 · C언어 ============================== */
  {
    id: 'c3-01',
    level: 'C3',
    kind: 'output',
    topic: 'printf',
    prompt: '아래 C 코드의 출력 결과는?',
    code: `int a = 7;
printf("%d", a);`,
    choices: ['7', '%d', 'a', '0'],
    answer: 0,
    explanation: '%d는 정수를 찍는 서식이에요. a에 담긴 7이 그 자리에 출력돼요.',
  },
  {
    id: 'c3-02',
    level: 'C3',
    kind: 'output',
    topic: '중첩 for',
    prompt: '별이 모두 몇 개 출력될까요?',
    code: `for (int i = 1; i <= 3; i++) {
    for (int j = 1; j <= 2; j++) {
        printf("*");
    }
}`,
    choices: ['2개', '3개', '6개', '5개'],
    answer: 2,
    explanation: '바깥 반복 3번 × 안쪽 반복 2번 = 6개예요. 중첩 for는 곱하기로 생각하면 쉬워요.',
  },
  {
    id: 'c3-03',
    level: 'C3',
    kind: 'output',
    topic: '배열 인덱스',
    prompt: '아래 C 코드의 출력 결과는?',
    code: `int arr[3] = {10, 20, 30};
printf("%d", arr[0] + arr[2]);`,
    choices: ['30', '40', '60', '10'],
    answer: 1,
    explanation: 'arr[0]은 10, arr[2]는 30이에요. 더하면 40이 출력돼요.',
  },
  {
    id: 'c3-04',
    level: 'C3',
    kind: 'output',
    topic: 'if · else',
    prompt: '아래 C 코드의 출력 결과는?',
    code: `int n = 5;
if (n % 2 == 0) printf("짝");
else printf("홀");`,
    choices: ['짝', '홀', '짝홀', '아무것도 안 나옴'],
    answer: 1,
    explanation: '5를 2로 나눈 나머지는 1이라서 짝수 조건이 거짓이에요. 그래서 else 쪽 "홀"이 출력돼요.',
  },
  {
    id: 'c3-05',
    level: 'C3',
    kind: 'blank',
    topic: 'scanf',
    prompt: '나이를 입력받아 출력하려고 해요. 빈칸에 들어갈 것은?',
    code: `int age;
scanf("____", &age);
printf("나이: %d", age);`,
    choices: ['%d', '%s', '&age', 'age'],
    answer: 0,
    explanation: 'scanf에서도 정수는 %d 서식을 써요. 변수 앞의 &는 "이 주소에 저장해 달라"는 표시예요.',
  },
  {
    id: 'c3-06',
    level: 'C3',
    kind: 'blank',
    topic: '중첩 for · 줄바꿈',
    prompt: '"**"를 한 줄씩 세 줄 출력하려면 빈칸에 무엇이 들어갈까요?',
    code: `for (int i = 0; i < 3; i++) {
    for (int j = 0; j < 2; j++) printf("*");
    printf("____");
}`,
    choices: ['\\n', '%d', ' ', 'i'],
    answer: 0,
    explanation: '안쪽 for가 별 두 개를 찍은 뒤 줄을 바꿔야 해요. 줄바꿈은 \\n 이에요.',
  },
  {
    id: 'c3-07',
    level: 'C3',
    kind: 'bug',
    topic: 'for 증감식',
    prompt: '1부터 5까지 더하는 코드인데 화면이 멈추지 않아요. 틀린 줄을 찾으세요.',
    lines: [`int sum = 0;`, `for (int i = 1; i <= 5; i--) {`, `    sum += i;`, `}`, `printf("%d", sum);`],
    answerLine: 1,
    explanation: 'i-- 는 값을 줄여서 조건(i <= 5)이 계속 참이 돼요. i++ 로 바꿔야 다섯 번만 반복해요.',
  },
  {
    id: 'c3-08',
    level: 'C3',
    kind: 'bug',
    topic: '배열 범위',
    prompt: '배열 3칸을 출력하려는데 마지막에 이상한 값이 나와요. 틀린 줄을 찾으세요.',
    lines: [`int arr[3] = {1, 2, 3};`, `for (int i = 0; i <= 3; i++) {`, `    printf("%d", arr[i]);`, `}`],
    answerLine: 1,
    explanation: '크기가 3인 배열의 인덱스는 0, 1, 2까지예요. i <= 3 이면 arr[3]까지 접근해서 범위를 넘어가요. i < 3 으로 써야 해요.',
  },
  {
    id: 'c3-09',
    level: 'C3',
    kind: 'order',
    topic: 'C 프로그램 뼈대',
    prompt: 'C 프로그램의 기본 뼈대를 순서대로 조립하세요.',
    blocks: ['#include <stdio.h>', 'int main() {', '    printf("Hello");', '    return 0;', '}'],
    explanation: '헤더를 포함하고 → main 함수를 열고 → 실행할 코드를 쓰고 → return 0 으로 끝내고 → 중괄호를 닫아요.',
  },
  {
    id: 'c3-10',
    level: 'C3',
    kind: 'order',
    topic: '성적 판정',
    prompt: '점수에 따라 A·B·C를 출력하는 코드예요. 순서대로 조립하세요.',
    blocks: [
      'int score = 85;',
      'if (score >= 90) printf("A");',
      'else if (score >= 80) printf("B");',
      'else printf("C");',
    ],
    explanation: '위에서부터 조건을 검사하고, 처음 맞는 하나만 실행해요. 85는 90보다 작고 80 이상이라서 B가 출력돼요.',
  },

  /* ============================== C4 · 유니티 C# ============================== */
  {
    id: 'c4-01',
    level: 'C4',
    kind: 'output',
    topic: 'Start',
    prompt: '게임을 시작하면 콘솔에 무엇이 찍힐까요?',
    code: `void Start() {
    Debug.Log("게임 시작");
}`,
    choices: ['게임 시작', 'Start', '아무것도 안 찍힘', '오류'],
    answer: 0,
    explanation: 'Start()는 게임이 시작될 때 딱 한 번 실행되는 유니티 기본 메서드예요.',
  },
  {
    id: 'c4-02',
    level: 'C4',
    kind: 'output',
    topic: 'Vector3',
    prompt: '아래 코드의 콘솔 출력은?',
    code: `void Start() {
    Vector3 p = new Vector3(1, 2, 3);
    Debug.Log(p.x + p.y);
}`,
    choices: ['3', '1', '2', '6'],
    answer: 0,
    explanation: 'Vector3는 x, y, z 세 값을 가져요. p.x는 1, p.y는 2라서 더하면 3이에요.',
  },
  {
    id: 'c4-03',
    level: 'C4',
    kind: 'output',
    topic: 'Update · Transform',
    prompt: '아래 Update() 코드가 매 프레임 하는 일은?',
    code: `void Update() {
    transform.Translate(Vector3.forward * 2f * Time.deltaTime);
}`,
    choices: [
      '앞쪽으로 조금씩 계속 이동한다',
      '딱 한 번만 이동한다',
      '제자리에서 회전한다',
      '크기가 두 배가 된다',
    ],
    answer: 0,
    explanation: 'Update는 매 프레임 실행돼요. Vector3.forward 방향으로 Time.deltaTime 만큼씩 움직여서 결국 "앞으로 계속" 이동해요.',
  },
  {
    id: 'c4-04',
    level: 'C4',
    kind: 'blank',
    topic: '충돌 · 태그',
    prompt: '"Enemy" 태그를 가진 물체와 부딪히면 사라지게 하려면 빈칸에 무엇이 들어갈까요?',
    code: `void OnCollisionEnter(Collision other) {
    if (other.gameObject.CompareTag("____")) {
        Destroy(gameObject);
    }
}`,
    choices: ['Enemy', 'Player', 'Floor', 'MainCamera'],
    answer: 0,
    explanation: 'CompareTag 안에는 유니티에서 정한 태그 이름을 넣어요. 적은 보통 Enemy 태그를 써요.',
  },
  {
    id: 'c4-05',
    level: 'C4',
    kind: 'blank',
    topic: 'GetComponent',
    prompt: '같은 오브젝트의 Rigidbody를 가져와 점프시키려고 해요. 빈칸에 들어갈 것은?',
    code: `void Start() {
    ____ rb = GetComponent<Rigidbody>();
    rb.AddForce(Vector3.up * 5f, ForceMode.Impulse);
}`,
    choices: ['Rigidbody', 'Transform', 'Collider', 'Vector3'],
    answer: 0,
    explanation: 'GetComponent<Rigidbody>() 로 가져온 부품은 Rigidbody 형식 변수에 담아야 해요. rb.AddForce로 힘을 줘요.',
  },
  {
    id: 'c4-06',
    level: 'C4',
    kind: 'bug',
    topic: 'Update 대소문자',
    prompt: '회전 코드를 넣었는데 오브젝트가 전혀 돌지 않아요. 틀린 줄을 찾으세요.',
    lines: [
      `public class Player : MonoBehaviour {`,
      `    void Start() {`,
      `        transform.position = new Vector3(0, 1, 0);`,
      `    }`,
      `    void update() {`,
      `        transform.Rotate(0, 1f, 0);`,
      `    }`,
      `}`,
    ],
    answerLine: 4,
    explanation: '유니티가 자동으로 불러 주는 메서드 이름은 대소문자를 구분해요. update가 아니라 대문자 U로 Update() 여야 해요.',
  },
  {
    id: 'c4-07',
    level: 'C4',
    kind: 'bug',
    topic: 'GetComponent 호출',
    prompt: '시작하자마자 컴파일 오류가 나요. 틀린 줄을 찾으세요.',
    lines: [
      `void Start() {`,
      `    Rigidbody rb = GetComponent<Rigidbody>;`,
      `    rb.AddForce(Vector3.up * 5f, ForceMode.Impulse);`,
      `}`,
    ],
    answerLine: 1,
    explanation: 'GetComponent는 메서드라서 괄호가 필요해요. GetComponent<Rigidbody>() 처럼 써야 해요.',
  },
  {
    id: 'c4-08',
    level: 'C4',
    kind: 'order',
    topic: '발사 로직',
    prompt: '스페이스를 누르면 총알이 나가는 로직이에요. 순서대로 조립하세요.',
    blocks: [
      'Space 키 입력을 확인한다',
      'GetComponent<Rigidbody>() 로 물리를 준비한다',
      'Instantiate(총알, 위치, 회전) 으로 총알을 만든다',
      'AddForce(Vector3.forward * 20f) 로 앞으로 날린다',
    ],
    explanation: '입력 확인 → 부품 준비 → 생성 → 힘 주기 순서예요. 생성한 뒤에 힘을 줘야 날아가요.',
  },
  {
    id: 'c4-09',
    level: 'C4',
    kind: 'order',
    topic: '충돌 처리',
    prompt: '적과 부딪혔을 때 처리하는 순서를 조립하세요.',
    blocks: [
      'OnCollisionEnter(Collision other) 가 호출된다',
      'other.gameObject.CompareTag("Enemy") 를 확인한다',
      '맞으면 Destroy(gameObject) 로 내 캐릭터를 없앤다',
      '아니면 Debug.Log("부딪힘") 으로 기록만 남긴다',
    ],
    explanation: '충돌이 감지되면 → 상대가 적인지 확인하고 → 맞을 때와 아닐 때로 나눠 처리해요.',
  },
];

export function problemsByLevel(level: string): CodingProblem[] {
  return CODING_PROBLEMS.filter((p) => p.level === level);
}

export function problemsOfKind(level: string, kind: CodingProblem['kind']): CodingProblem[] {
  return CODING_PROBLEMS.filter((p) => p.level === level && p.kind === kind);
}

export function problemById(id: string): CodingProblem | undefined {
  return CODING_PROBLEMS.find((p) => p.id === id);
}
