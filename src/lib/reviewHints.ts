/**
 * 복습용 개념·힌트 카드 (학생용)
 * - 정답 코드를 통째로 주지 않습니다. 스스로 확인할 질문과 방향만 줍니다.
 * - 트랙(스크래치·파이썬·로블록스·유니티)별 핵심 개념 + "막힐 때 보는 힌트"
 */
import { CURRICULUM, type Track, type WeekPlan } from './curriculum';

export interface Blocker {
  symptom: string;
  hints: string[];
  check: string;
}

export interface ConceptCard {
  id: string;
  emoji: string;
  title: string;
  oneLiner: string;
  points: string[];
  blockers: Blocker[];
}

export const REVIEW_CARDS: Partial<Record<Track, ConceptCard[]>> = {
  scratch: [
    {
      id: 'sc-order',
      emoji: '🧱',
      title: '순서대로 실행되는 블록',
      oneLiner: '스크래치는 위에서 아래로, 한 칸씩 차례대로 실행해요.',
      points: [
        '깃발을 눌렀을 때 블록이 맨 위에 있어야 시작해요.',
        '반복 안에 넣은 블록은 반복하는 동안 계속 실행돼요.',
        '같은 블록도 위에 있으면 먼저, 아래에 있으면 나중에 실행돼요.',
      ],
      blockers: [
        {
          symptom: '스프라이트가 움직이지 않아요',
          hints: [
            '깃발을 눌렀을 때 블록이 맨 위에 연결되어 있나요?',
            '움직임 블록이 반복 안에 들어가 있나요? 밖에 있으면 한 번만 움직여요.',
            '무대 위 스프라이트를 클릭했을 때 파랗게 선택되어 있나요?',
          ],
          check: '블록을 하나씩 떼어 내고 실행해 보면 어디서 멈추는지 보여요.',
        },
        {
          symptom: '점수가 올라가지 않아요',
          hints: [
            '점수 변수를 만들었나요? 변수 없이 숫자만 바꾸면 기록되지 않아요.',
            '점수를 1만큼 바꾸기 블록이 조건 안에 있나요?',
            '점수를 0으로 만들기를 게임 시작 때 한 번만 실행하고 있나요?',
          ],
          check: '변수 체크박스를 켜서 무대 위 숫자가 바뀌는지 눈으로 확인해 보세요.',
        },
      ],
    },
    {
      id: 'sc-loop',
      emoji: '🔁',
      title: '반복과 조건',
      oneLiner: '반복은 "같은 일을 여러 번", 조건은 "이럴 때만".',
      points: [
        '10번 반복은 정확히 10번, 계속 반복은 멈출 때까지예요.',
        '만약 ~라면 안에 넣은 블록만 조건이 맞을 때 실행돼요.',
        '계속 반복 안에 조건을 넣으면 계속 확인해요.',
      ],
      blockers: [
        {
          symptom: '게임이 멈추지 않아요',
          hints: [
            '계속 반복 안에 "멈추기"가 들어가 있나요?',
            '게임오버가 되었을 때 모든 코드를 멈추기로 끝내고 있나요?',
            '점수가 계속 올라가는 코드가 게임오버 뒤에도 도나요?',
          ],
          check: '멈추기 블록을 넣고, 그 아래 블록이 실행되지 않는지 확인해 보세요.',
        },
        {
          symptom: '복제본이 너무 많아져요',
          hints: [
            '복제하기 블록이 반복 안에서 계속 실행되고 있나요?',
            '복제본일 때 다시 복제하지 않도록 조건을 넣었나요?',
            '복제본이 화면 밖으로 나가면 지우기 하고 있나요?',
          ],
          check: '무대 아래 스프라이트 목록 숫자가 줄어드는지 보세요.',
        },
      ],
    },
  ],
  python: [
    {
      id: 'py-indent',
      emoji: '📐',
      title: '들여쓰기가 코드의 구조',
      oneLiner: '파이썬은 띄어쓰기로 "무엇 안에 속하는지"를 정해요.',
      points: [
        'if·for·while 아래 줄은 꼭 한 단계 들여써요 (스페이스 4칸).',
        '들여쓰기가 어긋나면 IndentationError가 나요.',
        '같은 높이의 줄끼리 한 덩어리로 실행돼요.',
      ],
      blockers: [
        {
          symptom: 'IndentationError가 나요',
          hints: [
            '오류에 나온 줄 번호와 그 위 줄의 들여쓰기를 나란히 보세요.',
            '탭과 스페이스가 섞여 있지 않나요? 한 가지로 통일해요.',
            'elif·else는 if와 같은 높이에 있어야 해요.',
          ],
          check: '오류 메시지의 마지막 줄이 "무엇이 잘못됐는지"를 말해 줘요.',
        },
        {
          symptom: '반복이 한 번만 돌아요',
          hints: [
            'for 아래에 실행할 줄이 여러 개인데 첫 줄만 들여쓰기 되어 있나요?',
            'while의 조건이 처음부터 거짓은 아닌가요?',
            '반복 안에서 조건을 바꾸는 줄이 빠지지 않았나요?',
          ],
          check: '반복 안 첫 줄에 print를 넣어 몇 번 도는지 세어 보세요.',
        },
      ],
    },
    {
      id: 'py-var',
      emoji: '🏷️',
      title: '변수와 함수',
      oneLiner: '변수는 이름표, 함수는 자주 쓰는 일의 묶음이에요.',
      points: [
        '변수 이름은 뜻이 보이게 (score, life, speed).',
        '함수는 def로 만들고, 필요한 값을 괄호 안에 받아요.',
        'return은 함수가 끝나며 남기는 값이에요.',
      ],
      blockers: [
        {
          symptom: '함수를 불렀는데 결과가 None이에요',
          hints: [
            '함수 안에서 print만 하고 return이 없나요?',
            'return을 반복문 안에 넣어 첫 번째 값만 돌려주고 있나요?',
            '함수를 부를 때 괄호를 빠뜨리지 않았나요?',
          ],
          check: '함수 끝에 return 값을 넣고, 부른 결과를 변수에 담아 print 해 보세요.',
        },
        {
          symptom: '리스트에서 IndexError가 나요',
          hints: [
            '리스트 길이가 몇인지 len()으로 확인해 보세요.',
            '첫 번째 자리는 0부터 시작해요. 마지막은 길이-1이에요.',
            '비어 있는 리스트에서 0번을 꺼내고 있지 않나요?',
          ],
          check: '꺼내기 전에 if len(items) > 0 으로 확인하는 습관을 들여요.',
        },
      ],
    },
  ],
  roblox: [
    {
      id: 'rb-part',
      emoji: '🧊',
      title: '파트와 좌표',
      oneLiner: '로블록스 세상은 파트(상자)와 위치 숫자로 이루어져 있어요.',
      points: [
        'Position은 파트의 중심 좌표예요 (x, y, z).',
        'Anchored를 켜면 중력에 떨어지지 않아요.',
        'CanCollide를 끄면 통과할 수 있어요.',
      ],
      blockers: [
        {
          symptom: '파트가 안 보여요',
          hints: [
            'Explorer에서 파트를 선택하고 카메라를 파트에 맞춰 보세요 (F 키).',
            'Workspace 안에 있나요? 다른 곳에 있으면 화면에 안 나와요.',
            '크기가 0이거나 위치가 너무 멀지 않은지 확인해요.',
          ],
          check: 'Properties의 Position 숫자를 보고 카메라를 그 좌표로 옮겨 보세요.',
        },
        {
          symptom: '플레이어가 바닥을 뚫고 떨어져요',
          hints: [
            '바닥 파트의 CanCollide가 켜져 있나요?',
            '바닥이 Anchored 상태인가요?',
            '바닥이 너무 얇아 빠르게 지나가고 있지 않나요?',
          ],
          check: '테스트 플레이에서 바닥을 클릭해 Properties를 확인해 보세요.',
        },
      ],
    },
    {
      id: 'rb-script',
      emoji: '⚡',
      title: '이벤트와 스크립트',
      oneLiner: '"무언가 일어났을 때" 실행되는 코드가 게임의 규칙이에요.',
      points: [
        'Touched는 무언가 닿았을 때 알려 줘요.',
        '변수는 스크립트 안에서만 살아 있어요.',
        'print를 넣으면 코드가 도는지 확인할 수 있어요.',
      ],
      blockers: [
        {
          symptom: '스크립트가 실행되지 않아요',
          hints: [
            '스크립트가 Workspace나 ServerScriptService 안에 있나요?',
            '첫 줄에 print("시작")을 넣어 Output 창을 확인해 보세요.',
            '오류가 빨간 글씨로 Output에 떠 있지 않나요?',
          ],
          check: 'Output 창을 열어 두고 테스트 플레이를 시작해 보세요.',
        },
        {
          symptom: '점수가 다시 0이 돼요',
          hints: [
            '점수를 스크립트 안 변수에만 담고 있나요?',
            '다시 시작하면 스크립트가 새로 도는지 확인해 보세요.',
            '남겨야 하는 값은 데이터 저장(DataStore)이 필요해요.',
          ],
          check: '게임을 나갔다 들어오면 무엇이 사라지는지 먼저 관찰해요.',
        },
      ],
    },
  ],
  unity: [
    {
      id: 'un-script',
      emoji: '🎬',
      title: '스크립트와 컴포넌트',
      oneLiner: '유니티는 오브젝트에 붙인 부품(컴포넌트)으로 움직여요.',
      points: [
        '스크립트를 만들면 오브젝트에 끌어다 붙여야 실행돼요.',
        'Start는 한 번, Update는 매 프레임 실행돼요.',
        'Inspector에서 연결한 값이 게임에 그대로 쓰여요.',
      ],
      blockers: [
        {
          symptom: '캐릭터가 움직이지 않아요',
          hints: [
            '스크립트가 플레이어 오브젝트에 붙어 있나요?',
            '입력 키 이름이 Input Manager와 같은가요?',
            '속도(speed) 값이 0은 아닌가요?',
          ],
          check: 'Update 안에 Debug.Log를 넣어 Console에 찍히는지 보세요.',
        },
        {
          symptom: 'Console에 CS 오류가 떠요',
          hints: [
            '오류의 첫 줄에 파일 이름과 줄 번호가 있어요. 그 줄부터 보세요.',
            '세미콜론(;)이 빠지지 않았나요?',
            '변수 이름의 대소문자가 정확한가요?',
          ],
          check: '오류를 다 지우기 전에는 Play 버튼이 제대로 동작하지 않아요.',
        },
      ],
    },
    {
      id: 'un-physics',
      emoji: '🏀',
      title: '물리와 충돌',
      oneLiner: 'Rigidbody는 힘과 중력을 받고, Collider는 부딪힘을 판정해요.',
      points: [
        '움직이는 물체에는 Rigidbody가 필요해요.',
        'Collider가 없으면 그냥 통과해요.',
        'Is Trigger를 켜면 부딪히지 않고 감지만 해요.',
      ],
      blockers: [
        {
          symptom: '물체가 벽을 통과해요',
          hints: [
            '둘 다 Collider를 가지고 있나요?',
            '빠르게 움직이면 Collision Detection을 Continuous로 바꿔 보세요.',
            '벽에 Rigidbody가 없어도 Collider만 있으면 막을 수 있어요.',
          ],
          check: 'Scene 화면에서 Collider 초록색 선이 보이는지 확인해요.',
        },
        {
          symptom: '점수 UI가 안 보여요',
          hints: [
            'Canvas 안에 Text를 만들었나요?',
            'Text 색이 배경과 같지 않은가요?',
            '스크립트에서 Text 오브젝트를 Inspector에 연결했나요?',
          ],
          check: 'Game 화면과 Scene 화면을 번갈아 보며 위치를 확인해요.',
        },
      ],
    },
  ],
};

/* ---------------------------------------------------------------- */
/* 24주 진도 ↔ 개념 카드 연결 (현재 주차 하이라이트)                  */
/* ---------------------------------------------------------------- */

/** 주차 제목·목표 문장에 나타나는 낱말로 그 주에 볼 개념 카드를 고릅니다 */
const CARD_KEYWORDS: Record<string, string[]> = {
  'sc-order': ['순서', '블록', '움직임', '10걸음', '모양', '소리', '이벤트', '깃발', '스프라이트', '무대', '좌표'],
  'sc-loop': ['반복', '조건', '변수', '감지', '복제', '방송', '목록', '난이도', '버그', '점수', '충돌', '레벨', '스테이지'],
  'py-indent': ['print', '화면', '들여쓰기', 'if', 'for', 'while', '입력', '오류', '조건', '반복'],
  'py-var': ['변수', '자료형', '리스트', '딕셔너리', '함수', '문자열', '모듈', '클래스', '파일'],
  'rb-part': ['파트', '스튜디오', '재질', '조명', '저장', '좌표', '카메라'],
  'rb-script': ['스크립트', '이벤트', '함수', '변수', '점수', '터치', '충돌', '리더보드', '데이터', '사운드', '레벨'],
  'un-script': ['스크립트', '씬', '오브젝트', '머티리얼', '프리팹', '입력', 'UI', '애니메이션', '카메라', '저장'],
  'un-physics': ['물리', '충돌', 'Rigidbody', '체력', '적', '파티클', '점수', '스테이지', '빌드', '버그'],
};

export interface WeekHighlight {
  /** 이번 주(다음에 배울) 주차 */
  plan: WeekPlan;
  /** 그 주에 함께 볼 개념 카드 (1~2장) */
  cards: ConceptCard[];
  /** 24주 중 완료한 주 수 */
  doneCount: number;
}

/** 학생의 현재 진도(다음 주차)에 맞는 개념 카드를 골라 줍니다. */
export function highlightForWeek(track: Track, week: number, doneCount = 0): WeekHighlight | null {
  const plan = CURRICULUM[track]?.find((w) => w.week === week);
  if (!plan) return null;
  const pool = REVIEW_CARDS[track] ?? [];
  const text = `${plan.title} ${plan.goal}`.toLowerCase();

  const scored = pool
    .map((card) => {
      const keys = CARD_KEYWORDS[card.id] ?? [];
      const score = keys.reduce((sum, k) => (text.includes(k.toLowerCase()) ? sum + 1 : sum), 0);
      return { card, score };
    })
    .sort((a, b) => b.score - a.score);

  const hits = scored.filter((s) => s.score > 0).slice(0, 2).map((s) => s.card);
  const cards = hits.length ? hits : pool.slice(0, 1);
  return { plan, cards, doneCount };
}
