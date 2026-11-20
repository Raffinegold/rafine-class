-- 자동 생성: scripts/gen-seed-sql.mjs (src/data/materialSeed.ts)
-- 파이썬 1~4주차 8차시 — 학생용 내용 / 교사용 수업안 / 정답 코드가 분리되어 들어갑니다.
insert into public.materials
  (seed_key, kind, title, track, week, session, summary, student_content, teacher_guide, answer_code, ai_tip, link_url, code_lang, published, sort_no)
values
  ('py-w01-s1', 'theory', '변수 하나로 내 소개 카드 만들기', 'python', 1, 1,
   '변수·input·print로 이름을 넣으면 내 카드가 출력됩니다.', $jc${"goal":"이름·나이·좋아하는 것을 입력하면 내 소개 카드가 출력된다","preview":"이름: 지훈\n나이: 14\n=== 내 소개 카드 ===\n이름: 지훈\n나이: 14\n=====================","words":["변수","input()","print()"],"conceptTitle":"변수는 이름표가 붙은 상자","concept":[{"code":"name = \"지훈\"","mean":"name이라는 상자에 \"지훈\"을 넣는다"},{"code":"age = 14","mean":"age 상자에 숫자 14를 넣는다"},{"code":"print(name)","mean":"상자에서 꺼내 화면에 보여 준다"},{"code":"name = \"수민\"","mean":"같은 상자에 새 값을 넣으면 예전 값은 사라진다"},{"code":"input(\"이름: \")","mean":"물음표를 띄우고 학생이 친 글자를 문자열로 받는다"}],"predict":{"code":"a = 10\nb = \"10\"\nprint(a + a)\nprint(b + b)","answer":"20 / 1010 (b는 글자라서 이어 붙습니다)"},"steps":[{"title":"1단계 — 상자 3개 만들기","code":"name = input(\"이름: \")\nage = input(\"나이: \")\nhobby = input(\"좋아하는 것: \")"},{"title":"2단계 — 테두리 먼저 찍기","code":"print(\"=== 내 소개 카드 ===\")"},{"title":"3단계 — f-string으로 값 끼우기","code":"print(f\"이름: {name}\")\nprint(f\"나이: {age}\")\nprint(f\"좋아하는 것: {hobby}\")","note":"문자열 앞에 f를 붙이고, {} 안에 변수 이름을 씁니다."},{"title":"4단계 — 닫는 줄까지","code":"print(\"====================\")"}],"mistakes":[{"symptom":"SyntaxError: unterminated string literal","cause":"따옴표 한쪽을 닫지 않았다"},{"symptom":"화면에 {name}이 그대로 나온다","cause":"문자열 앞 f를 빼먹었다"},{"symptom":"NameError: name 'nmae' is not defined","cause":"변수 이름 철자가 다르다(대소문자 포함)"}],"hints":["빨간 글씨의 마지막 줄과 가리키는 줄 번호를 먼저 읽어요.","중괄호가 글자로 보이면 f를 잊은 거예요.","컴퓨터는 Name과 name을 다른 이름으로 봐요."],"selfcheck":["내 이름·나이·좋아하는 것으로 값 3개를 바꿨다","f를 붙인 줄과 안 붙인 줄의 차이를 설명할 수 있다","오류가 났을 때 빨간 글씨 마지막 줄을 읽었다","1주_내카드_내이름.py 로 저장했다"],"note":"input()이 받는 건 언제나 글자예요. 14라고 쳐도 \"14\"라는 글자입니다."}$jc$::jsonb, $jt${"demo":"'오늘 2시간 끝나면 이게 뜹니다. 이름 치고, 나이 치고, 좋아하는 것 치면 내 카드가 나와요. 오늘 배우는 건 딱 하나, 변수입니다.'","analogy":"상자에 물건을 넣고 이름표를 붙인다 → name = \"지훈\". print는 뚜껑을 열어 보여 주는 것, input은 빈 상자를 내밀고 글자를 받아 오는 것.","board":[{"say":"컴퓨터는 기억을 어디에 둘까요?","write":"[    ] 빈 상자 1개"},{"say":"이름표를 붙여 봅시다","write":"상자 위에 name"},{"say":"값을 넣습니다","write":"상자 안에 \"지훈\""},{"say":"꺼내서 보여 주기","write":"print(name) → 지훈"},{"say":"학생이 친 글자를 받아 오려면?","write":"input(\"이름: \") + 화살표로 상자에 연결"},{"say":"f-string은 틀에 끼우기","write":"f\"이름: {name}\" → 중괄호만 색 다르게"},{"say":"함정","write":"a = 10 / b = \"10\" → a+a=20, b+b=1010"}],"ai":[{"when":"만들기 시작 3분","what":"카드 문구 아이디어 3개","prompt":"중학생 소개 카드에 들어갈 짧은 문구 3개만 제안해줘. 코드는 주지 마.","rule":"문구만 받고 코드는 받지 않는다"},{"when":"마무리 5분","what":"내 설명 검사","prompt":"내가 쓴 코드 설명: 'name은 이름을 넣는 상자고...' 이 설명에서 틀린 부분만 짚어줘.","rule":"AI가 쓴 코드를 붙여 넣으면 안 됨(내 것만 검사)"}],"errors":[{"symptom":"SyntaxError","cause":"따옴표·괄호 짝","coach":"빨간 줄이 가리키는 줄 번호부터 봐요. 그 줄 위아래만 보면 90% 나옵니다."},{"symptom":"{name} 그대로 출력","cause":"f 누락","coach":"중괄호가 글자로 보이면 f를 잊은 거예요."},{"symptom":"NameError","cause":"오타·대소문자","coach":"컴퓨터는 Name과 name을 다른 사람으로 봅니다."}],"tips":["input()이 문자열을 준다는 건 오늘은 소리만 하고 넘어갑니다. 2회차에 직접 터뜨려서 가르치는 게 오래 남습니다.","판서는 왼쪽에 상자 그림, 오른쪽에 코드로 나눠 쓰면 대응시키기 쉽습니다."]}$jt$::jsonb,
   'name = input("이름: ")
age = input("나이: ")
hobby = input("좋아하는 것: ")

print("=== 내 소개 카드 ===")
print(f"이름: {name}")
print(f"나이: {age}")
print(f"좋아하는 것: {hobby}")
print("====================")', '막히면 "내 카드에 넣을 짧은 문구 3개만 제안해줘. 코드는 주지 마."라고 물어보세요. 고르는 건 나!', null,
   'python', true, 10),
  ('py-w01-s2', 'theory', '1주 2회차 — 계산 붙이기 + 에러 3종 잡기', 'python', 1, 2,
   'int()로 나이를 숫자로 바꿔 계산하고, 문법·실행·논리 오류를 직접 고칩니다.', $jc${"goal":"내 카드에 계산(태어난 해)을 붙이고, 에러 3종을 각각 1개씩 고친다","preview":"★ 20개\n이름 : 지훈\n나이 : 14살\n태어난 해 : 2013년\n취미 : 코딩\n기분 : good\n★ 20개","words":["int()","TypeError","논리 오류"],"conceptTitle":"int()는 글자를 숫자로 바꾸는 문","concept":[{"code":"\"14\"","mean":"액자에 걸린 사진 — 계산이 안 된다"},{"code":"14","mean":"실제 지폐 — 계산이 된다"},{"code":"int(\"14\")","mean":"문을 통과시켜 숫자로 바꾼다"},{"code":"int(input(\"나이: \"))","mean":"받자마자 숫자로 바꿔서 상자에 넣는다"},{"code":"print(\"19\" + \"1\")","mean":"\"191\" — 글자끼리는 이어 붙는다"}],"steps":[{"title":"오늘 할 일 3개","note":"① 지난 시간 카드 못 만든 데까지 마무리 ② 에러 3종 직접 고치기 ③ 업그레이드 미션 1개 이상"},{"title":"A. 문법 오류","code":"name = input(\"이름: \")\nprint(f\"안녕하세요 {name}님)"},{"title":"B. 실행 오류","code":"age = input(\"나이: \")\nprint(f\"내년에는 {age + 1}살\")"},{"title":"C. 논리 오류 (에러가 안 나는데 결과가 이상함)","code":"mood = input(\"오늘 기분: \")\nprint(\"오늘 기분은 {mood}입니다.\")"}],"mistakes":[{"symptom":"TypeError: unsupported operand type(s) for +: 'str' and 'int'","cause":"int()를 빼고 계산했다"},{"symptom":"ValueError: invalid literal for int()","cause":"숫자가 아닌 글자를 넣었다 ('열네 살')"},{"symptom":"카드가 두 번 겹쳐 나온다","cause":"실행 버튼을 두 번 눌렀다"}],"hints":["에러 이름을 먼저 읽어 보세요 (TypeError).","\"글자 + 숫자\"가 문제인지 확인해 보세요.","int(...)를 input 바깥에 씌워 보세요 → age = int(input(\"나이: \"))"],"selfcheck":["내 파일이 실행되고 값 3개가 내 것으로 바뀌었다","에러 3종을 각각 1번 이상 직접 고쳤다","미션 1개 이상 붙였다","1분 발표: 내가 고친 것 / 아직 아쉬운 점"],"note":"C는 빨간 글씨가 하나도 안 뜹니다. 조용한 버그가 제일 위험해요."}$jc$::jsonb, $jt${"demo":"'오늘은 새로 배우는 게 없습니다. 못 만든 거 끝내기, 빨간 글씨 잡기, 그리고 카드 한 단계 업그레이드 — 오늘 끝나면 카드에 계산이 들어갑니다.'","analogy":"\"14\"(글자)는 액자에 걸린 사진, 14(숫자)는 실제 지폐. 사진으로는 계산할 수 없고, 문(int())을 통과시켜야 계산이 됩니다.","board":[{"say":"각자 어디서 멈췄는지 확인, 3분은 무조건 혼자","write":"진행 상황 3칸: 코드 완성 / 실행 성공 / 저장"},{"say":"age + 1을 일부러 다 같이 터뜨린다","write":"\"14\" + 1 → TypeError (빨간 글씨 그대로 판서)"},{"say":"int(\"14\") 실험","write":"input → \"14\" → int → 14 화살표"},{"say":"디버깅 A/B/C 배분 (모둠별 1개, 끝나면 옆으로)","write":"A 문법 / B 실행 / C 논리 3칸 표"},{"say":"업그레이드 미션","write":"기본 / 도전 / 심화 3단 표"},{"say":"저장·발표","write":"내가 고친 것 / 아직 아쉬운 점"}],"ai":[{"when":"디버깅 45~70분","what":"에러 원인 힌트만","prompt":"이 에러가 왜 나는지 힌트만 2줄로 알려줘. 고친 코드는 주지 마. 에러: TypeError: unsupported operand type(s) for +: 'str' and 'int'","rule":"정답 코드를 받았으면 지우고 다시 짜게 한다"}],"errors":[{"symptom":"TypeError ... 'str' and 'int'","cause":"int() 누락","coach":"액자 사진으로 계산하려고 했네요. 문을 통과시켜 봐요."},{"symptom":"ValueError: invalid literal for int()","cause":"숫자 대신 글자 입력","coach":"안내 문구를 '숫자로 입력해 주세요'로 바꿔 보게 하세요."},{"symptom":"태어난 해가 1년 어긋남","cause":"만 나이/한국식 혼동","coach":"우리 반 기준을 정하고 주석으로 남기기 — 주석 습관으로 연결."}],"tips":["논리 오류 C는 반드시 다 같이 짚고 갑니다. 3주 조건문에서 가장 크게 돌아옵니다.","막힌 학생에게 코드를 주지 말고 질문 2개: \"지금 화면에 뭐가 나와야 하지?\" \"그 숫자는 어디서 왔지?\""]}$jt$::jsonb,
   'name = input("이름: ")
age = int(input("나이: "))
hobby = input("좋아하는 것: ")
mood = input("오늘 기분: ")

print("★" * 20)
print(f"이름 : {name}")
print(f"나이 : {age}살")
print(f"태어난 해 : {2026 - age + 1}년")
print(f"취미 : {hobby}")
print(f"기분 : {mood}")
print("★" * 20)', '에러가 나면 빨간 글씨를 그대로 복사해 "원인 후보 3개만, 해결은 내가 할게"라고 물어보세요.', null,
   'python', true, 20),
  ('py-w01-upgrade', 'upgrade', '1주 업그레이드 미션 — 카드에 계산과 기분 한 줄', 'python', 1, 2,
   '기본/도전/심화 중 1개 이상 골라 내 카드를 한 단계 올립니다.', $jc${"goal":"내 카드에 기능 1개를 더 붙인다","missions":{"basic":"테두리 = 를 ★ 로 바꾸고, 카드에 오늘 기분 한 줄 추가하기 (print(\"★\" * 20))","challenge":"나이를 받아 태어난 해를 계산해 출력하기 (2026 - age + 1)","deep":"콜론 위치를 통일해 정렬 맞추기 + 취미가 비어 있으면 \"아직 없음\" 출력"},"hints":["문자열에 숫자를 곱하면 반복돼요. \"★\" * 20","태어난 해 = 올해 - 나이 + 1 (우리 반 기준)","if는 다음 주에 배웁니다. 오늘은 값으로만 처리해요."],"selfcheck":["미션 1개 이상 붙였다","내 값으로 3번 실행했다","1분 발표를 준비했다"]}$jc$::jsonb, $jt${"ai":[{"when":"업그레이드 들어가기 전","what":"기능 3안 받고 1개 고르기","prompt":"내 소개 카드에 붙일 수 있는 기능 3개만 제안해줘. 코드는 쓰지 마.","rule":"고르는 건 학생"}],"errors":[{"symptom":"기본 미션도 못 끝냄","cause":"시간 부족","coach":"2줄 카드로 줄여 성공 경험 먼저. 나머지는 2주차에 이어받기."}],"tips":["잘한 학생에겐 심화보다 \"친구 코드 읽고 설명해 주기\" — 1인 운영에서 가장 효율 좋은 역할입니다."]}$jt$::jsonb,
   null, '업그레이드 아이디어가 안 떠오르면 "내 카드에 붙일 기능 3개만 제안해줘"라고 묻고 하나만 골라요.', null,
   'python', true, 30),
  ('py-w02-s1', 'theory', '연산자로 용돈 계산기 만들기', 'python', 2, 1,
   '//·%·** 로 거스름돈과 지폐 개수를 계산합니다.', $jc${"goal":"물건 값·개수·가진 돈을 넣으면 총액과 거스름돈, 지폐 개수가 나온다","preview":"물건 가격: 1200\n개수: 3\n가진 돈: 5000\n총 금액: 3600원\n거스름돈: 1400원\n1000원짜리 1장, 남는 돈 400원","words":["산술 연산자","//","%"],"conceptTitle":"파이썬의 계산 기호","concept":[{"code":"3 * 4","mean":"곱하기 → 12"},{"code":"7 / 2","mean":"나누기(소수) → 3.5"},{"code":"7 // 2","mean":"몫만 → 3"},{"code":"7 % 2","mean":"나머지 → 1"},{"code":"2 ** 3","mean":"거듭제곱 → 8"}],"predict":{"code":"print(7 / 2)\nprint(7 // 2)\nprint(7 % 2)\nprint(2 ** 3)","answer":"3.5 / 3 / 1 / 8"},"steps":[{"title":"1단계 — 값 3개 받기 (숫자로!)","code":"price = int(input(\"물건 가격: \"))\ncount = int(input(\"개수: \"))\nmoney = int(input(\"가진 돈: \"))"},{"title":"2단계 — 총액과 거스름돈","code":"total = price * count\nchange = money - total"},{"title":"3단계 — 출력","code":"print(f\"총 금액: {total}원\")\nprint(f\"거스름돈: {change}원\")"},{"title":"4단계 — 지폐로 바꿔 보기","code":"print(f\"1000원짜리 {change // 1000}장, 남는 돈 {change % 1000}원\")"},{"title":"5단계 — 내 물건 값으로 3번 실행하기","note":"편의점에서 산 물건 상황으로 바꿔 보세요."}],"mistakes":[{"symptom":"TypeError","cause":"int() 없이 곱했다"},{"symptom":"거스름돈이 -1400원","cause":"가진 돈보다 총액이 큼 (계산은 맞다, 안내 문구가 필요)"},{"symptom":"SyntaxError","cause":"print(change // 1000장) 처럼 글자를 코드 안에 썼다"}],"hints":["계산 순서를 종이에 먼저 적어 보세요.","지폐 개수는 통째로 → //, 남는 돈은 %","결과가 400.0처럼 나오면 / 를 쓴 거예요."],"selfcheck":["/ , // , % 결과가 어떻게 다른지 말할 수 있다","내 물건 값으로 3번 실행했다","거스름돈이 마이너스인 경우를 직접 만들었다"]}$jc$::jsonb, $jt${"demo":"'오늘 끝나면 편의점 계산기가 됩니다. 물건 값, 개수, 가진 돈만 넣으면 거스름돈까지. 새로 배우는 건 기호 2개 — // 와 % 입니다.'","analogy":"케이크 7개를 2명이: 7/2=3.5(반쪽까지), 7//2=3(통째로), 7%2=1(남은 조각). 1000원 지폐는 통째로(//), 남는 돈은(%).","board":[{"say":"지난주에 나이 계산했죠? 그게 계산이었습니다","write":"+ - *"},{"say":"나누기는 두 가지가 있습니다","write":"7 / 2 = 3.5 / 7 // 2 = 3 / 7 % 2 = 1"},{"say":"왜 두 개가 필요할까?","write":"5000원으로 1200원 3개 → 1400 → 1000원 1장, 400원"},{"say":"계산 순서","write":"price * count 먼저, 그다음 빼기"},{"say":"결과를 변수에 담으면 다시 쓸 수 있다","write":"total = price * count"},{"say":"함정","write":"int 빼고 곱하면 TypeError — 1주 복습"}],"ai":[{"when":"예측 단계 10분","what":"검산만 받기","prompt":"내 예상: 7/2=3, 7//2=3, 7%2=1. 틀린 것만 알려줘. 설명은 한 줄씩.","rule":"AI 없이 먼저 적게 하고, 적은 뒤에만 연다"}],"errors":[{"symptom":"TypeError 곱하기","cause":"int() 누락","coach":"1주 2회차와 같은 실수예요 — 숫자로 바꿨는지 확인."},{"symptom":"결과가 1400.0","cause":"/ 를 씀","coach":"지폐 개수는 통째로 — //"},{"symptom":"모두 0이 나옴","cause":"int() 두 번 겹침 또는 변수 이름 오타","coach":"변수 표를 종이에 그려 보게"}],"tips":["판서는 계산 과정을 세로로(총액 → 거스름돈 → 지폐 개수) 쓰면 코드 순서를 그대로 따라옵니다."]}$jt$::jsonb,
   'price = int(input("물건 가격: "))
count = int(input("개수: "))
money = int(input("가진 돈: "))

total = price * count
change = money - total

print(f"총 금액: {total}원")
print(f"거스름돈: {change}원")
print(f"1000원짜리 {change // 1000}장, 남는 돈 {change % 1000}원")', '내가 먼저 예상값을 적은 뒤에만 AI에게 "틀린 것만 알려줘"라고 물어보세요.', null,
   'python', true, 10),
  ('py-w02-code', 'code', '2주 예제 코드 — 그대로 쳐도 되고, 바꿔도 됩니다', 'python', 2, 1,
   '계산기 → 영수증으로 넘어갈 때 쓰는 예제 코드 모음', $jc${"goal":"예제를 한 줄씩 실행하며 // 와 % 를 손에 익힌다","steps":[{"title":"거스름돈 계산","code":"money = 5000\nprice = 1200\ncount = 3\ntotal = price * count\nprint(total, money - total)"},{"title":"지폐 개수 세기","code":"change = 1400\nprint(change // 1000, change % 1000)"},{"title":"콤마로 예쁘게","code":"print(f\"{1234567:,}원\")"},{"title":"거듭제곱","code":"print(2 ** 10)"}],"note":"예제를 그대로 내는 것보다, 숫자를 내 상황으로 바꿔서 3번 실행하는 게 중요해요."}$jc$::jsonb, $jt${"tips":["예제 코드는 \"읽고 설명하기\"용입니다. 붙여 넣고 끝내지 않게, 한 줄마다 무슨 일을 하는지 말하게 하세요."]}$jt$::jsonb,
   null, '한 줄이 이해 안 되면 "이 줄이 무슨 일을 하는지 초등학생에게 설명하듯 1줄로"라고 물어보세요.', null,
   'python', true, 20),
  ('py-w02-s2', 'theory', '2주 2회차 — 계산기를 영수증 표로', 'python', 2, 2,
   'len·in·upper와 f-string 정렬로 표 모양 영수증을 만듭니다.', $jc${"goal":"계산기를 영수증처럼 줄 맞춘 표로 출력한다","preview":"--------------------\n메뉴            가격\n--------------------\n김밥           3,500원\n라면           4,000원\n--------------------\n합계           7,500원","words":["len()","in","f-string 정렬"],"conceptTitle":"f-string은 틀, 정렬 기호는 줄자","concept":[{"code":"len(\"김밥\")","mean":"글자 수 → 2"},{"code":"\"김\" in \"김밥\"","mean":"들어 있는지 확인 → True"},{"code":"\"hi\".upper()","mean":"대문자로 → \"HI\""},{"code":"f\"{menu:<8}\"","mean":"8칸 자리를 만들고 왼쪽부터 채운다"},{"code":"f\"{price:>10,}\"","mean":"오른쪽 정렬 + 천 단위 콤마"}],"steps":[{"title":"영수증 뼈대 — 빈칸을 채워 보세요","code":"menu1 = input(\"메뉴1: \")\nprice1 = int(input(\"가격1: \"))\nmenu2 = input(\"메뉴2: \")\nprice2 = int(input(\"가격2: \"))\n\nprint(\"-\" * 20)\nprint(f\"{'메뉴':<8}{'가격':>10}\")\nprint(\"-\" * 20)"},{"title":"줄 맞춰 출력","code":"print(f\"{menu1:<8}{price1:>10,}원\")\nprint(f\"{menu2:<8}{price2:>10,}원\")"},{"title":"합계 줄","code":"print(\"-\" * 20)\nprint(f\"{'합계':<8}{price1 + price2:>10,}원\")"}],"mistakes":[{"symptom":"TypeError: can only concatenate str","cause":"+ 로 글자와 숫자를 이어 붙였다"},{"symptom":"ValueError: Invalid format specifier","cause":"f\"{price:,>10}\" 처럼 순서를 바꿨다 (정렬 먼저, 콤마 뒤)"},{"symptom":"한글 줄만 어긋난다","cause":"한글은 폭이 2칸이라 영어 기준으로 맞추면 살짝 밀린다"}],"hints":["정렬 기호가 먼저, 콤마는 뒤 — >10,","표가 안 맞으면 폭 숫자를 1씩 바꿔 보세요.","합계는 계산해서 바로 넣을 수 있어요."],"selfcheck":["영수증이 표처럼 정렬된다","합계가 맞다","내 메뉴·가격으로 바꿨다"]}$jc$::jsonb, $jt${"demo":"'지난 시간 계산기는 숫자만 예뻤죠. 오늘은 보기 좋게 만듭니다 — 영수증처럼 줄 맞춰서.'","analogy":"f\"{menu:<8}\" = \"이 자리에 8칸짜리 자리를 만들어 두고 왼쪽부터 채워라\". <는 왼쪽, >는 오른쪽, , 는 천 단위, .2f 는 소수 둘째 자리.","board":[{"say":"영수증에서 중요한 건?","write":"줄 맞춤 / 합계"},{"say":"글자 개수 세기","write":"len(\"김밥\") = 2"},{"say":"자리 만들기","write":"{menu:<8} ← 8칸 상자 그림"},{"say":"숫자는 오른쪽 정렬 + 콤마","write":"{price:>10,}"},{"say":"합계는 계산해서 바로","write":"{price1 + price2:>10,}"},{"say":"함정","write":"\"가격: \" + 3500 → TypeError (1주 복습)"}],"ai":[{"when":"70~85분","what":"표가 안 맞는 이유만 묻기","prompt":"파이썬 f-string으로 표를 맞췄는데 한글 줄만 어긋나. 코드 말고 이유만 3줄로 알려줘.","rule":"\"코드 전체 다시 짜줘\" 요청 금지"}],"errors":[{"symptom":"can only concatenate str","cause":"+ 로 글자와 숫자","coach":"이어 붙이기는 글자끼리만. 숫자는 f-string으로."},{"symptom":"Invalid format specifier","cause":"정렬·콤마 순서","coach":"정렬 기호가 먼저, 콤마는 뒤."},{"symptom":"표가 안 맞음","cause":"한글 폭 2칸","coach":"심화 미션으로 승격 — 좌절 대신 발견으로."}],"tips":["기본 미션도 못 끝낸 학생은 2줄 영수증으로 줄여 성공 경험 먼저."]}$jt$::jsonb,
   'menu1 = input("메뉴1: ")
price1 = int(input("가격1: "))
menu2 = input("메뉴2: ")
price2 = int(input("가격2: "))

print("-" * 20)
print(f"{''메뉴'':<8}{''가격'':>10}")
print("-" * 20)
print(f"{menu1:<8}{price1:>10,}원")
print(f"{menu2:<8}{price2:>10,}원")
print("-" * 20)
print(f"{''합계'':<8}{price1 + price2:>10,}원")', '표가 어긋나면 "왜 한글 줄만 밀리는지 이유만 3줄로"라고 물어보세요. 코드는 받지 않아요.', null,
   'python', true, 30),
  ('py-w03-s1', 'theory', 'if로 나이별 요금 안내 만들기', 'python', 3, 1,
   'if/elif/else로 갈림길을 만들고 경계값을 확인합니다.', $jc${"goal":"나이를 넣으면 유아·어린이·청소년·성인 요금 중 하나가 나온다","preview":"나이: 13\n어린이 요금: 3,000원","words":["조건","if","elif / else"],"conceptTitle":"조건문은 갈림길 표지판","concept":[{"code":"if 조건:","mean":"조건이 True일 때 아래(들여쓰기)를 실행"},{"code":"elif 다른 조건:","mean":"위가 아니고 이게 True일 때"},{"code":"else:","mean":"위가 전부 아닐 때"},{"code":":","mean":"조건 줄 끝에 반드시 콜론"},{"code":"들여쓰기 4칸","mean":"이게 없으면 조건문이 아니다"},{"code":"= vs ==","mean":"= 는 넣기, == 는 같은지 물어보기"}],"predict":{"code":"age = 14\n\nif age >= 20:\n    print(\"성인\")\nelif age >= 13:\n    print(\"청소년\")\nelse:\n    print(\"어린이\")","answer":"청소년 — 첫 줄이 False라서 둘째 줄에서 걸립니다"},"steps":[{"title":"1단계 — 나이 받기","code":"age = int(input(\"나이: \"))"},{"title":"2단계 — 갈래 3개","code":"if age < 8:\n    print(\"유아 요금: 무료\")\nelif age < 14:\n    print(\"어린이 요금: 3,000원\")"},{"title":"3단계 — 나머지 갈래","code":"elif age < 20:\n    print(\"청소년 요금: 5,000원\")\nelse:\n    print(\"성인 요금: 8,000원\")"},{"title":"4단계 — 경계값 5번 실행","note":"6, 10, 13, 15, 20을 넣어 결과가 바뀌는 곳을 찾으세요."}],"mistakes":[{"symptom":"IndentationError","cause":"들여쓰기 4칸이 아니거나 탭·스페이스가 섞임"},{"symptom":"SyntaxError: expected ':'","cause":"콜론 누락"},{"symptom":"if age = 13 에서 SyntaxError","cause":"비교는 =="}],"hints":["조건 줄 끝에 콜론이 있는지 봐요.","들여쓰기를 지우면 무슨 일이 나는지 직접 확인해 보세요.","물어볼 땐 ==, 넣을 땐 ="],"selfcheck":["경계값 8·14·20에서 결과가 바뀌는 걸 확인했다","= 와 == 의 차이를 예로 말할 수 있다","들여쓰기를 지웠을 때 나는 에러를 봤다"]}$jc$::jsonb, $jt${"demo":"'지금까지는 위에서 아래로 한 줄씩만 갔습니다. 오늘부터 컴퓨터가 생각합니다. 나이를 넣으면 네 갈래 중 하나로 갈라져요.'","analogy":"조건문은 갈림길 표지판 — 처음 표지판이 맞으면 그 길로 가고 다른 길은 쳐다보지 않는다. 그래서 순서가 중요합니다.","board":[{"say":"오늘부턴 갈라집니다","write":"분기 그림 3갈래"},{"say":"if = 만약 ~라면","write":"if age < 8:"},{"say":"콜론과 들여쓰기","write":"4칸 상자 그려서 \"이 안에 있어야 실행\""},{"say":"elif = 위가 아니고","write":"위에서부터 화살표"},{"say":"else = 나머지 전부","write":"마지막 갈래"},{"say":"== 질문, = 넣기","write":"age = 13 vs age == 13"},{"say":"함정","write":"들여쓰기 지워 IndentationError 즉석 시연"}],"ai":[{"when":"35~45분","what":"갈래 기준 질문 2개","prompt":"중학생 요금 기준을 4단계로 나눈다면 경계를 어디로 두면 좋을까? 근거만 2줄.","rule":"기준은 학생이 정하고 근거만 참고"}],"errors":[{"symptom":"IndentationError","cause":"공백/탭 혼용","coach":"4칸 스페이스로 통일. 탭은 쓰지 않기."},{"symptom":"expected ':'","cause":"콜론","coach":"조건 줄 끝엔 항상 콜론."},{"symptom":"모두 else만 실행","cause":"int() 누락 → 문자열 비교","coach":"숫자 비교인지 글자 비교인지 확인."}],"tips":["예측 정답은 청소년. if age >= 13 을 위로 올리면 20도 청소년이 됩니다 — 2회차 논리 오류 재료."]}$jt$::jsonb,
   'age = int(input("나이: "))

if age < 8:
    print("유아 요금: 무료")
elif age < 14:
    print("어린이 요금: 3,000원")
elif age < 20:
    print("청소년 요금: 5,000원")
else:
    print("성인 요금: 8,000원")', '갈래 기준을 정할 때 "근거만 2줄"로 물어보세요. 기준을 정하는 건 내가!', null,
   'python', true, 10),
  ('py-w03-s2', 'theory', '3주 2회차 — 조건 순서 잡고 등급 계산기', 'python', 3, 2,
   '순서 논리 오류를 잡고 and/or로 등급 계산기를 완성합니다.', $jc${"goal":"에러가 안 나는데 답이 틀리는 코드를 고치고, 등급 계산기를 완성한다","preview":"점수: 85\n출석률(%): 90\n85점 → B등급\n수료증 발급 대상입니다.","words":["논리 오류","and / or","범위 검사"],"conceptTitle":"표지판은 위에서부터, 한 번만","concept":[{"code":"if score >= 60: ...\nelif score >= 80: ...","mean":"85점은 첫 줄에서 이미 True → 뒤는 보지 않는다"},{"code":"A and B","mean":"둘 다 맞아야 True"},{"code":"A or B","mean":"하나만 맞아도 True"},{"code":"not A","mean":"뒤집기"},{"code":"score < 0 or score > 100","mean":"범위 밖 입력 막기"}],"steps":[{"title":"오늘 할 일","note":"① 요금 안내 마무리 ② 논리 오류 잡기 ③ 등급 계산기 완성"},{"title":"순서가 결과를 바꾼다 — 왜 다 B가 나올까?","code":"if score >= 60:\n    grade = \"B\"\nelif score >= 80:\n    grade = \"A\""},{"title":"고치는 두 방법","note":"① 큰 수를 먼저 ② >= 대신 < 로 뒤집어 쓰기"},{"title":"등급 계산기 뼈대 — 빈칸 채우기","code":"score = int(input(\"점수: \"))\nattend = int(input(\"출석률(%): \"))\n\nif score >= 90:\n    grade = \"A\"\nelif score >= 80:\n    grade = \"B\"\nelif score >= 70:\n    grade = \"C\"\nelse:\n    grade = \"D\"\n\nprint(f\"{score}점 → {grade}등급\")\n\nif ______ and ______:\n    print(\"수료증 발급 대상입니다.\")\nelse:\n    print(\"다음 주에 한 번 더 도전해 보세요.\")"}],"mistakes":[{"symptom":"조건을 뒤집었더니 등급이 다 틀림","cause":"넓은 조건을 위에 두면 뒤가 굶는다"},{"symptom":"수료증이 항상 나온다","cause":"and 대신 or / 괄호 오류"},{"symptom":"105점도 A","cause":"범위 검사가 없다"}],"hints":["85를 넣으면 첫 줄이 True인지 확인해 보세요.","표지판은 위에서부터, 한 번만 지나갑니다.","범위 검사는 맨 위에 score < 0 or score > 100"],"selfcheck":["85·90·0·105를 넣어 모두 확인했다","순서를 바꿨을 때 왜 틀리는지 말로 설명할 수 있다","and 가 무슨 뜻인지 예로 들 수 있다"]}$jc$::jsonb, $jt${"demo":"'오늘 제일 중요한 순간입니다. 빨간 글씨가 안 뜨는데 답이 틀린 코드를 보여 줄 거예요. 이걸 잡으면 진짜로 아는 겁니다.'","analogy":"조건문은 한 번 지나가면 다시 안 돌아옵니다. 넓은 문을 위에 두면 뒤가 굶어 죽어요 — 좁은 문을 위에, 넓은 문을 아래에.","board":[{"say":"3주 1회차 코드 열기, 내 나이 기준으로 바꿨는지","write":"완성/미완성 체크"},{"say":"순서 뒤집힌 코드를 같이 실행","write":"85점 → B / A가 안 나오는 이유 화살표"},{"say":"고치는 두 방법","write":"① 큰 수 먼저 ② < 로 뒤집기"},{"say":"and / or 표","write":"진리표 4칸"},{"say":"등급 계산기","write":"등급 표 (90/80/70)"},{"say":"업그레이드","write":"score < 0 or score > 100"}],"ai":[{"when":"70~85분","what":"조건문 구멍(반례) 찾기","prompt":"내 등급 기준: 90 이상 A, 80 이상 B, 70 이상 C, 나머지 D, 점수는 0~100. 이 기준에서 결과가 이상해지는 입력 5개만 알려줘. 코드는 쓰지 마.","rule":"받은 입력을 직접 실행해 확인한 것만 인정"}],"errors":[{"symptom":"전부 같은 등급","cause":"조건 순서","coach":"위에서 한 번 맞으면 끝 — 좁은 문을 위로."},{"symptom":"수료증이 항상 나옴","cause":"and/or 혼동","coach":"둘 다 맞아야 한다면 and."},{"symptom":"105점도 A","cause":"범위 검사 없음","coach":"도전 미션으로 승격."}],"tips":["C(논리 오류)는 모둠별로 서로 다른 순서 오류를 주고 바꿔 고치게 하면 15분이면 정리됩니다."]}$jt$::jsonb,
   'score = int(input("점수: "))
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
        print(f"다음 주에 한 번 더 도전해 보세요. (수료증까지 {90 - score}점)")', '"내 기준에서 결과가 이상해지는 입력 5개만 알려줘. 코드는 쓰지 마." — 받은 입력은 꼭 직접 실행해 확인!', null,
   'python', true, 20),
  ('py-w04-s1', 'theory', '4주 1회차 — 미니 프로젝트 설계와 골격', 'python', 4, 1,
   '배운 것을 한 프로그램으로 묶습니다. 오늘의 새 문법은 없습니다.', $jc${"goal":"질문 2개로 4가지 추천이 나오는 프로그램 골격을 만든다","preview":"=== 오늘 뭐 먹지? ===\n밥/면 중에 뭐가 당겨요? (밥/면): 밥\n매운 거 좋아해요? (yes/no): yes\n추천: 제육덮밥 🔥","words":["설계","경우의 수","and"],"conceptTitle":"경우의 수를 세는 게 설계","concept":[{"code":"질문 1개 = 갈래 2개","mean":"밥 / 면"},{"code":"질문 2개 = 갈래 4개","mean":"2 × 2"},{"code":"질문 3개 = 8갈래","mean":"3개는 너무 많다는 걸 직접 세어 보기"},{"code":"kind == \"밥\" and spicy == \"yes\"","mean":"두 조건을 동시에"}],"steps":[{"title":"설계 5칸 — 코드 치기 전에 종이에 먼저","note":"① 무엇을 물어볼까 ② 무엇을 저장할까 ③ 어떻게 갈라질까 ④ 무엇을 보여줄까 ⑤ 무엇을 빼야 안전할까(개인정보)"},{"title":"골격 코드 — 따라 치고 내 주제로 바꾸기","code":"print(\"=== 오늘 뭐 먹지? ===\")\n\nkind = input(\"밥/면 중에 뭐가 당겨요? (밥/면): \")\nspicy = input(\"매운 거 좋아해요? (yes/no): \")\n\nif kind == \"밥\" and spicy == \"yes\":\n    print(\"추천: 제육덮밥 🔥\")\nelif kind == \"밥\" and spicy == \"no\":\n    print(\"추천: 카레라이스\")\nelif kind == \"면\" and spicy == \"yes\":\n    print(\"추천: 짬뽕 🔥\")\nelse:\n    print(\"추천: 잔치국수\")"},{"title":"내 주제로 바꾸는 3가지 방향 (하나 고르기)","note":"① 메뉴 추천기 ② 오늘 뭐 입지? ③ 나만의 퀴즈(성향 테스트)"}],"mistakes":[{"symptom":"어떤 답을 넣어도 마지막 추천만 나온다","cause":"and 대신 쉼표를 썼거나 비교를 = 로 했다"},{"symptom":"SyntaxError","cause":"if kind == 밥 — 따옴표 누락"},{"symptom":"4갈래인데 2개만 나온다","cause":"경우의 수를 덜 셈 (2 × 2 = 4 확인)"}],"hints":["질문 2개면 갈래는 4개예요. 표를 그려 보세요.","조건을 소리 내어 두 번 읽어 보세요.","비교는 ==, 글자는 따옴표로 감싸요."],"selfcheck":["4가지 답 조합을 모두 넣어 봤다","내 주제로 1번 이상 바꿨다","설계 5칸 종이를 채웠다(버리지 말고 보관)"],"note":"추천기에 전화번호·주소는 필요 없어요. 개인정보는 넣지 않습니다."}$jc$::jsonb, $jt${"demo":"'오늘은 새로 배우는 게 없습니다. 처음으로 프로그램 하나를 통째로 만듭니다. 질문 2개로 4가지 추천이 나오는 오늘 뭐 먹지? — 이게 끝나면 내가 만든 프로그램이 하나 생깁니다.'","analogy":"경우의 수를 세는 게 설계 — 질문 1개 = 갈래 2개, 2개 = 4개. 3개면 8갈래라 너무 많다는 걸 직접 세게 하면 범위 조절을 스스로 합니다.","board":[{"say":"오늘 목표는 한 프로그램","write":"빈 화면에 완성 화면 먼저"},{"say":"설계 5칸","write":"질문/저장/갈래/출력/빼기"},{"say":"경우의 수","write":"2 × 2 = 4, 3개면 8"},{"say":"and로 묶기","write":"kind == \"밥\" and spicy == \"yes\""},{"say":"마지막은 else","write":"else는 남은 전부"},{"say":"함정","write":"어떤 답에도 마지막만 나오는 코드 즉석 시연"},{"say":"개인정보","write":"\"추천기에 전화번호는 필요 없다\" 한 줄"}],"ai":[{"when":"주제 고를 때 10분","what":"주제 후보 3개만 받기","prompt":"중학생이 만드는 파이썬 추천기 주제 3개만 제안해줘. 코드는 절대 쓰지 마.","rule":"고르는 건 나 / AI가 쓴 코드 붙이기 금지 / 설명 못 하는 줄은 지운다"}],"errors":[{"symptom":"어떤 답이든 마지막만","cause":"and 대신 쉼표 / = 비교","coach":"조건을 소리 내어 두 번 읽어 보기."},{"symptom":"NameError","cause":"변수 이름 다름","coach":"변수 표에 적힌 이름 그대로."},{"symptom":"첫 줄만 실행되고 끝","cause":"들여쓰기 위치","coach":"if 블록 안/밖 구분."}],"tips":["설계 종이는 반드시 걷어서 보관합니다. 2회차에 이 종이가 없으면 처음부터 다시 짜게 됩니다."]}$jt$::jsonb,
   'print("=== 오늘 뭐 먹지? ===")

kind = input("밥/면 중에 뭐가 당겨요? (밥/면): ")
spicy = input("매운 거 좋아해요? (yes/no): ")

if kind == "밥" and spicy == "yes":
    print("추천: 제육덮밥 🔥")
elif kind == "밥" and spicy == "no":
    print("추천: 카레라이스")
elif kind == "면" and spicy == "yes":
    print("추천: 짬뽕 🔥")
else:
    print("추천: 잔치국수")', '주제가 안 정해지면 "파이썬 추천기 주제 3개만, 코드는 쓰지 마"라고 묻고 내가 하나 골라요.', null,
   'python', true, 10),
  ('py-w04-s2', 'theory', '4주 2회차 — 추천기 완성·업그레이드·발표', 'python', 4, 2,
   '이상한 입력을 막고, 예산 기능을 붙여 1분 발표까지 합니다.', $jc${"goal":"4갈래가 모두 다르게 나오고, 이상한 입력에는 안내 문구가 나온다","preview":"=== 오늘 뭐 먹지? ===\n밥/면 중에 뭐가 당겨요? (밥/면): 면\n매운 거 좋아해요? (yes/no): yes\n예산(원): 8000\n추천: 짬뽕 🔥 — 든든하게 먹고 와요","words":["이상한 입력","안내 문구","발표"],"conceptTitle":"이상한 입력은 손님이 문을 잘못 연 것","concept":[{"code":"kind == \"밥\"","mean":"정확히 \"밥\"일 때만"},{"code":"else:","mean":"\"밥\"도 \"면\"도 아니면 안내 문구"},{"code":"반복은 5주에","mean":"다시 물어보는 기능은 5주 반복문에서 배웁니다 — 오늘은 안내 문구까지만"}],"steps":[{"title":"오늘 할 일","note":"① 4갈래 다 나오게 완성 ② 이상한 입력 넣어 보기(ㅂ, rice, 빈칸) ③ 업그레이드 + 1분 발표"},{"title":"이상한 입력 막기","code":"if kind == \"밥\":\n    ...\nelif kind == \"면\":\n    ...\nelse:\n    print(\"'밥' 또는 '면'으로 다시 입력해 주세요.\")"},{"title":"1분 발표 3문장","note":"① 이 프로그램은 ___을 물어보고 ___을 추천합니다. ② 제가 고친 건 ___입니다. ③ 아직 아쉬운 점은 ___입니다."}],"mistakes":[{"symptom":"4갈래 중 2개만 나온다","cause":"and 조건이 중복되거나 빠졌다"},{"symptom":"예산 추가 후 다 안 나온다","cause":"int() 누락"},{"symptom":"빈칸 입력 시 멈춘다","cause":"int(\"\") 에서 ValueError — 지금 단계에선 정상"}],"hints":["조합 표(밥·매움 / 밥·안매움 / 면·매움 / 면·안매움)를 채워 보세요.","이상한 입력 3개를 직접 넣어 보세요.","발표는 내 코드를 한 줄씩 읽으며 \"이 줄은 ~한다\"를 적으면 됩니다."],"selfcheck":["4가지 조합이 모두 다른 결과를 낸다","이상한 입력에 안내 문구가 나온다","미션 1개 이상 붙였다","4주_추천기_내이름.py 로 저장했다"]}$jc$::jsonb, $jt${"demo":"'오늘로 4주가 끝납니다. 완성 + 발표예요. 발표에서 아직 아쉬운 점을 말할 수 있으면 그게 진짜 이해한 겁니다.'","analogy":"손님(사용자)은 뭐든 칩니다. 프로그램이 안내판을 세워 두면 무너지지 않습니다. 다시 물어보는 문은 5주 반복문에서 만듭니다.","board":[{"say":"설계 종이 꺼내기","write":"5칸 표 옆에 체크"},{"say":"완성 (4갈래 전부)","write":"실행 결과 4줄 판서"},{"say":"이상한 입력 3개 실험","write":"ㅂ / rice / 빈칸 → 안내 문구"},{"say":"미션 선택","write":"기본/도전/심화 3단"},{"say":"저장·발표·기록","write":"3문장 틀"},{"say":"5주 예고","write":"같은 질문을 5번 하려면? → 반복문"}],"ai":[{"when":"발표 준비 105분","what":"발표 3문장 다듬기","prompt":"내 발표문: '이 프로그램은 밥이랑 면 물어보고 추천해요. 제가 고친 건...' 어색한 부분만 2군데 짚어줘. 새로 쓰지 마.","rule":"AI가 쓴 문장을 그대로 읽기 금지 — 내 말로 다시"}],"errors":[{"symptom":"4갈래 중 2개만","cause":"and 조건 중복·누락","coach":"조합 표를 채우게."},{"symptom":"빈칸에서 멈춤","cause":"int(\"\") ValueError","coach":"지금 단계에선 정상 — 안내 문구로 처리."},{"symptom":"발표를 못 함","cause":"자기 코드를 안 읽어 봄","coach":"한 줄씩 읽으며 \"이 줄은 ~한다\"를 적게."}],"tips":["8갈래(심화)는 욕심내지 않게 — 4갈래 완성이 우선입니다.","발표는 칭찬 1 + 질문 1로 짧게. \"왜 이 메뉴를 추천하게 했어요?\"가 설계 설명이 됩니다."]}$jt$::jsonb,
   'print("=== 오늘 뭐 먹지? ===")

kind = input("밥/면 중에 뭐가 당겨요? (밥/면): ")
spicy = input("매운 거 좋아해요? (yes/no): ")
budget = int(input("예산(원): "))

if kind == "밥" and spicy == "yes":
    pick = "제육덮밥 🔥"
elif kind == "밥" and spicy == "no":
    pick = "카레라이스"
elif kind == "면" and spicy == "yes":
    pick = "짬뽕 🔥"
elif kind == "면" and spicy == "no":
    pick = "잔치국수"
else:
    pick = ""

if pick == "":
    print("''밥'' 또는 ''면''으로 다시 입력해 주세요.")
else:
    if budget < 6000:
        print(f"추천: {pick} — 가성비 좋은 메뉴로 골랐어요")
    else:
        print(f"추천: {pick} — 든든하게 먹고 와요")', '발표 전에 "내 발표문에서 어색한 부분만 2군데"라고 물어보세요. 새로 써 달라고 하지 않기!', null,
   'python', true, 20),
  ('py-w04-upgrade', 'upgrade', '4주 업그레이드 미션 — 예산·이유·8갈래', 'python', 4, 2,
   '추천기에 이유 한 줄, 예산, 질문 3개까지 단계적으로 붙입니다.', $jc${"goal":"내 추천기에 기능 1개를 더 붙인다","missions":{"basic":"추천마다 이유 한 줄 붙이기 — print(\"추천: 카레라이스 — 안 맵고 든든해요\")","challenge":"예산을 물어 6000원 미만이면 \"가성비 메뉴\", 이상이면 \"든든 메뉴\" 문구 바꾸기","deep":"질문 3개(8갈래)로 늘리기 + 친구 추천기를 실행해 보기"},"hints":["budget = int(input(\"예산: \")) 로 받아요.","if budget < 6000: 아래에 문구를 나눠 쓰세요.","8갈래 표를 먼저 종이에 그려 보세요."],"selfcheck":["미션 1개 이상 붙였다","내 추천 이유를 말로 설명할 수 있다"]}$jc$::jsonb, $jt${"ai":[{"when":"기능 확장 전","what":"기능 3안 받고 1개 고르기","prompt":"내 메뉴 추천기에 붙일 기능 3개만 제안해줘. 코드는 쓰지 마.","rule":"고르는 건 학생"}],"tips":["심화는 \"질문 3개면 8갈래\"라는 사실만 확인시켜도 충분합니다."]}$jt$::jsonb,
   null, '"이 작품에 기능 3개 제안해줘, 내가 1개 고를게" — 딱 한 개만 골라 붙여요.', null,
   'python', true, 30),
  ('py-resource-link', 'link', '파이썬 공식 튜토리얼 (한글) — 막힐 때 찾아보는 사전', 'python', 1, 1,
   '수업에서 배운 개념을 공식 문서에서 다시 확인하는 링크', $jc${"goal":"수업에서 막힌 개념을 공식 문서에서 찾아보는 습관 만들기","steps":[{"title":"이렇게 써요","note":"전부 읽지 않습니다. 오늘 배운 단어(input, if, for, list, dict, def)만 검색해서 예제 1개씩 실행해 보세요."}],"note":"모르는 단어가 나오면 선생님께 먼저 물어보고, 그다음 문서에서 찾아보세요."}$jc$::jsonb, $jt${"tips":["학생이 문서를 읽고 이해하는 것이 목표가 아닙니다. \"찾는 방법\"을 아는 것이 목표입니다."]}$jt$::jsonb,
   null, '문서가 어려우면 "이 문단을 중학생에게 설명하듯 3줄로"라고 물어보세요.', 'https://docs.python.org/ko/3/tutorial/',
   'python', true, 90)
on conflict (seed_key) do update set
  kind = excluded.kind,
  title = excluded.title,
  track = excluded.track,
  week = excluded.week,
  session = excluded.session,
  summary = excluded.summary,
  student_content = excluded.student_content,
  teacher_guide = excluded.teacher_guide,
  answer_code = excluded.answer_code,
  ai_tip = excluded.ai_tip,
  link_url = excluded.link_url,
  code_lang = excluded.code_lang,
  published = excluded.published,
  sort_no = excluded.sort_no,
  updated_at = now();

-- 배정이 없는 학생은 파이썬 1주차 1회차에서 시작합니다 (원장님이 화면에서 바꿀 수 있음)
