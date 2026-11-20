-- 자동 생성: scripts/gen-seed-sql.mjs (src/data/seed.ts)
-- 실행 전용 데모 데이터: 학생 5명(앱과 같은 PIN), 단어 세트/단어, 상점 상품
-- 학생 PIN 은 앱 로그인 화면에서 쓰는 값과 같습니다. bcrypt 해시로만 저장됩니다.

insert into public.students (name, class_name, grade, level, tosel_level, pin_hash, nickname, parent_token, coding_level, enabled_subjects)
values
  ('김서연', '초등B', 5, 3, 'Basic', crypt('1111', gen_salt('bf')), '별빛서연', 'a1b2c3d4e5f60718293a4b5c6d7e8f90', 'C2', '{english,coding}'),
  ('박준우', '초등B', 6, 3, 'Basic', crypt('2222', gen_salt('bf')), '코딩준우', 'b2c3d4e5f60718293a4b5c6d7e8f9012', 'C3', '{coding}'),
  ('이하은', '초등A', 3, 2, 'Starter', crypt('3333', gen_salt('bf')), '하늘이', 'c3d4e5f60718293a4b5c6d7e8f901234', 'C1', '{coding}'),
  ('최민준', '중등A', 7, 4, 'Junior', crypt('4444', gen_salt('bf')), '민준게임', 'd4e5f60718293a4b5c6d7e8f90123456', 'C4', '{coding}'),
  ('정유진', '초등A', 2, 1, 'Pre-Starter', crypt('5555', gen_salt('bf')), '유진별', 'e5f60718293a4b5c6d7e8f9012345678', 'C1', '{english}')
on conflict (parent_token) do nothing;

insert into public.word_sets (name, level, day_index)
values
  ('Level 1 · Day 01', 1, 1),
  ('Level 1 · Day 02', 1, 2),
  ('Level 2 · Day 01', 2, 1),
  ('Level 2 · Day 02', 2, 2),
  ('Level 3 · Day 01', 3, 1),
  ('Level 3 · Day 02', 3, 2),
  ('Level 4 · Day 01', 4, 1),
  ('Level 4 · Day 02', 4, 2),
  ('Level 5 · Day 01', 5, 1),
  ('Level 5 · Day 02', 5, 2)
on conflict (level, day_index) do nothing;

insert into public.words (set_id, word, meaning, pos, ipa, example, example_ko, order_no)
select ws.id, v.word, v.meaning, v.pos, v.ipa, v.example, v.example_ko, v.order_no
from (values
  (1, 1, 'apple', '사과', 'n', '/ˈæpl/', 'I eat an apple after coding class.', '나는 코딩 수업이 끝나면 사과를 먹어요.', 1),
  (1, 1, 'book', '책', 'n', '/bʊk/', 'This book is about robots.', '이 책은 로봇에 관한 책이에요.', 2),
  (1, 1, 'cat', '고양이', 'n', '/kæt/', 'The cat sleeps on my keyboard.', '고양이가 내 키보드 위에서 자요.', 3),
  (1, 1, 'dog', '개', 'n', '/dɔːɡ/', 'My dog waits at the door.', '우리 개가 문 앞에서 기다려요.', 4),
  (1, 1, 'egg', '달걀', 'n', '/eɡ/', 'I boil an egg for breakfast.', '나는 아침에 달걀을 삶아요.', 5),
  (1, 1, 'fish', '물고기', 'n', '/fɪʃ/', 'The fish swims in the tank.', '물고기가 수조 안에서 헤엄쳐요.', 6),
  (1, 1, 'girl', '소녀', 'n', '/ɡɜːrl/', 'The girl draws a game map.', '그 소녀는 게임 지도를 그려요.', 7),
  (1, 1, 'hand', '손', 'n', '/hænd/', 'Raise your hand to answer.', '대답하려면 손을 들어요.', 8),
  (1, 1, 'ice', '얼음', 'n', '/aɪs/', 'Put some ice in the water.', '물에 얼음을 좀 넣어요.', 9),
  (1, 1, 'jump', '뛰다', 'v', '/dʒʌmp/', 'The rabbit can jump high.', '토끼는 높이 뛸 수 있어요.', 10),
  (1, 2, 'key', '열쇠', 'n', '/kiː/', 'I lost my classroom key.', '나는 교실 열쇠를 잃어버렸어요.', 1),
  (1, 2, 'milk', '우유', 'n', '/mɪlk/', 'Drink milk every morning.', '매일 아침 우유를 마셔요.', 2),
  (1, 2, 'nose', '코', 'n', '/noʊz/', 'The puppy has a wet nose.', '강아지의 코는 젖어 있어요.', 3),
  (1, 2, 'open', '열다', 'v', '/ˈoʊpən/', 'Open the window, please.', '창문을 열어 주세요.', 4),
  (1, 2, 'pencil', '연필', 'n', '/ˈpensl/', 'Write your name with a pencil.', '연필로 이름을 써요.', 5),
  (1, 2, 'rain', '비', 'n', '/reɪn/', 'The rain stops at noon.', '비가 정오에 그쳐요.', 6),
  (1, 2, 'sun', '해', 'n', '/sʌn/', 'The sun is bright today.', '오늘은 해가 밝아요.', 7),
  (1, 2, 'tree', '나무', 'n', '/triː/', 'A bird sits in the tree.', '새가 나무에 앉아 있어요.', 8),
  (1, 2, 'water', '물', 'n', '/ˈwɔːtər/', 'Please bring me some water.', '물 좀 가져다 주세요.', 9),
  (1, 2, 'yellow', '노란', 'adj', '/ˈjeloʊ/', 'She wears a yellow shirt.', '그녀는 노란 셔츠를 입어요.', 10),
  (2, 1, 'animal', '동물', 'n', '/ˈænɪml/', 'The zoo has many animals.', '동물원에는 동물이 많아요.', 1),
  (2, 1, 'because', '왜냐하면', 'conj', '/bɪˈkɔːz/', 'I like coding because it is fun.', '코딩이 재미있어서 좋아해요.', 2),
  (2, 1, 'climb', '오르다', 'v', '/klaɪm/', 'We climb the hill on Saturdays.', '우리는 토요일마다 언덕에 올라요.', 3),
  (2, 1, 'country', '나라', 'n', '/ˈkʌntri/', 'Korea is my country.', '한국은 내 나라예요.', 4),
  (2, 1, 'dinner', '저녁 식사', 'n', '/ˈdɪnər/', 'We have dinner at seven.', '우리는 7시에 저녁을 먹어요.', 5),
  (2, 1, 'easy', '쉬운', 'adj', '/ˈiːzi/', 'This game is easy for beginners.', '이 게임은 초보자에게 쉬워요.', 6),
  (2, 1, 'family', '가족', 'n', '/ˈfæməli/', 'My family watches movies together.', '우리 가족은 함께 영화를 봐요.', 7),
  (2, 1, 'finish', '끝내다', 'v', '/ˈfɪnɪʃ/', 'Finish your homework first.', '숙제를 먼저 끝내요.', 8),
  (2, 1, 'garden', '정원', 'n', '/ˈɡɑːrdn/', 'Flowers grow in the garden.', '정원에서 꽃이 자라요.', 9),
  (2, 1, 'hungry', '배고픈', 'adj', '/ˈhʌŋɡri/', 'I am hungry after class.', '수업 후에 배가 고파요.', 10),
  (2, 2, 'invite', '초대하다', 'v', '/ɪnˈvaɪt/', 'I invite my friends to my birthday.', '생일에 친구들을 초대해요.', 1),
  (2, 2, 'kitchen', '부엌', 'n', '/ˈkɪtʃɪn/', 'Mom is cooking in the kitchen.', '엄마가 부엌에서 요리해요.', 2),
  (2, 2, 'library', '도서관', 'n', '/ˈlaɪbreri/', 'I read books in the library.', '도서관에서 책을 읽어요.', 3),
  (2, 2, 'morning', '아침', 'n', '/ˈmɔːrnɪŋ/', 'I stretch every morning.', '나는 매일 아침 기지개를 켜요.', 4),
  (2, 2, 'picture', '그림', 'n', '/ˈpɪktʃər/', 'Draw a picture of your robot.', '네 로봇 그림을 그려 봐요.', 5),
  (2, 2, 'question', '질문', 'n', '/ˈkwestʃən/', 'Ask a question if you are not sure.', '확실하지 않으면 질문하세요.', 6),
  (2, 2, 'remember', '기억하다', 'v', '/rɪˈmembər/', 'Remember to save your file.', '파일 저장하는 걸 기억해요.', 7),
  (2, 2, 'strong', '힘센', 'adj', '/strɔːŋ/', 'He is strong enough to carry it.', '그는 그것을 들 만큼 힘이 세요.', 8),
  (2, 2, 'together', '함께', 'adv', '/təˈɡeðər/', 'We study English together.', '우리는 함께 영어를 공부해요.', 9),
  (2, 2, 'weather', '날씨', 'n', '/ˈweðər/', 'The weather is cold today.', '오늘 날씨가 추워요.', 10),
  (3, 1, 'borrow', '빌리다', 'v', '/ˈbɑːroʊ/', 'Can I borrow your charger?', '충전기를 빌려도 될까요?', 1),
  (3, 1, 'careful', '조심스러운', 'adj', '/ˈkerfl/', 'Be careful with the glass.', '유리잔을 조심히 다뤄요.', 2),
  (3, 1, 'decide', '결정하다', 'v', '/dɪˈsaɪd/', 'We decide the game topic today.', '우리는 오늘 게임 주제를 정해요.', 3),
  (3, 1, 'describe', '묘사하다', 'v', '/dɪˈskraɪb/', 'Describe your favorite place in English.', '좋아하는 장소를 영어로 묘사해 봐요.', 4),
  (3, 1, 'environment', '환경', 'n', '/ɪnˈvaɪrənmənt/', 'We should protect the environment.', '우리는 환경을 보호해야 해요.', 5),
  (3, 1, 'famous', '유명한', 'adj', '/ˈfeɪməs/', 'This academy is famous in Cheonan.', '이 학원은 천안에서 유명해요.', 6),
  (3, 1, 'honest', '정직한', 'adj', '/ˈɑːnɪst/', 'An honest answer is always better.', '정직한 대답이 항상 더 좋아요.', 7),
  (3, 1, 'instead', '대신에', 'adv', '/ɪnˈsted/', 'Let''s use a loop instead.', '대신 반복문을 써 봐요.', 8),
  (3, 1, 'introduce', '소개하다', 'v', '/ˌɪntrəˈduːs/', 'Introduce yourself to the new student.', '새 학생에게 자신을 소개해요.', 9),
  (3, 1, 'journey', '여행', 'n', '/ˈdʒɜːrni/', 'The journey to Seoul takes two hours.', '서울까지 가는 여정은 두 시간 걸려요.', 10),
  (3, 2, 'mistake', '실수', 'n', '/mɪˈsteɪk/', 'A mistake helps you learn.', '실수는 배움을 도와요.', 1),
  (3, 2, 'necessary', '필요한', 'adj', '/ˈnesəseri/', 'Water is necessary for life.', '물은 삶에 필요해요.', 2),
  (3, 2, 'opinion', '의견', 'n', '/əˈpɪnjən/', 'Share your opinion with the team.', '팀에게 네 의견을 나눠 봐요.', 3),
  (3, 2, 'possible', '가능한', 'adj', '/ˈpɑːsəbl/', 'Is it possible to finish today?', '오늘 끝내는 게 가능한가요?', 4),
  (3, 2, 'prepare', '준비하다', 'v', '/prɪˈper/', 'Prepare your presentation for Friday.', '금요일 발표를 준비하세요.', 5),
  (3, 2, 'protect', '보호하다', 'v', '/prəˈtekt/', 'Sunglasses protect your eyes.', '선글라스는 눈을 보호해요.', 6),
  (3, 2, 'reason', '이유', 'n', '/ˈriːzn/', 'Tell me the reason you chose it.', '그것을 고른 이유를 말해 봐요.', 7),
  (3, 2, 'suggest', '제안하다', 'v', '/səˈdʒest/', 'I suggest a simple design.', '간단한 디자인을 제안해요.', 8),
  (3, 2, 'trouble', '문제', 'n', '/ˈtrʌbl/', 'Tell the teacher if you have trouble.', '문제가 있으면 선생님께 말해요.', 9),
  (3, 2, 'volunteer', '자원봉사자', 'n', '/ˌvɑːlənˈtɪr/', 'She is a volunteer at the library.', '그녀는 도서관 자원봉사자예요.', 10),
  (4, 1, 'achieve', '달성하다', 'v', '/əˈtʃiːv/', 'You can achieve your goal step by step.', '목표를 한 걸음씩 달성할 수 있어요.', 1),
  (4, 1, 'approach', '접근법', 'n', '/əˈproʊtʃ/', 'Try a different approach to the problem.', '문제에 다른 접근법을 시도해 봐요.', 2),
  (4, 1, 'benefit', '이익', 'n', '/ˈbenɪfɪt/', 'Daily review has a big benefit.', '매일 복습은 큰 이익이 있어요.', 3),
  (4, 1, 'compare', '비교하다', 'v', '/kəmˈper/', 'Compare the two results carefully.', '두 결과를 주의 깊게 비교하세요.', 4),
  (4, 1, 'consider', '고려하다', 'v', '/kənˈsɪdər/', 'Consider the user before coding.', '코딩 전에 사용자를 고려하세요.', 5),
  (4, 1, 'contribute', '기여하다', 'v', '/kənˈtrɪbjuːt/', 'Everyone can contribute one idea.', '누구나 아이디어 하나씩 기여할 수 있어요.', 6),
  (4, 1, 'decrease', '감소하다', 'v', '/dɪˈkriːs/', 'Errors decrease with practice.', '연습하면 오류가 감소해요.', 7),
  (4, 1, 'efficient', '효율적인', 'adj', '/ɪˈfɪʃnt/', 'This code is short and efficient.', '이 코드는 짧고 효율적이에요.', 8),
  (4, 1, 'encourage', '격려하다', 'v', '/ɪnˈkɜːrɪdʒ/', 'Teachers encourage students to ask.', '선생님은 학생들이 질문하도록 격려해요.', 9),
  (4, 1, 'establish', '설립하다', 'v', '/ɪˈstæblɪʃ/', 'They establish a new club.', '그들은 새 동아리를 설립해요.', 10),
  (4, 2, 'evidence', '증거', 'n', '/ˈevɪdəns/', 'Find evidence before you decide.', '결정하기 전에 증거를 찾아요.', 1),
  (4, 2, 'independent', '독립적인', 'adj', '/ˌɪndɪˈpendənt/', 'She is an independent learner.', '그녀는 독립적인 학습자예요.', 2),
  (4, 2, 'influence', '영향', 'n', '/ˈɪnfluəns/', 'Friends have a strong influence on us.', '친구는 우리에게 큰 영향을 줘요.', 3),
  (4, 2, 'maintain', '유지하다', 'v', '/meɪnˈteɪn/', 'Maintain a steady study routine.', '꾸준한 공부 습관을 유지하세요.', 4),
  (4, 2, 'opportunity', '기회', 'n', '/ˌɑːpərˈtuːnəti/', 'This contest is a good opportunity.', '이 대회는 좋은 기회예요.', 5),
  (4, 2, 'participate', '참여하다', 'v', '/pɑːrˈtɪsɪpeɪt/', 'All students participate in the demo day.', '모든 학생이 시연회에 참여해요.', 6),
  (4, 2, 'purpose', '목적', 'n', '/ˈpɜːrpəs/', 'What is the purpose of this app?', '이 앱의 목적은 무엇인가요?', 7),
  (4, 2, 'require', '요구하다', 'v', '/rɪˈkwaɪər/', 'This project requires teamwork.', '이 프로젝트는 협동을 요구해요.', 8),
  (4, 2, 'responsible', '책임 있는', 'adj', '/rɪˈspɑːnsəbl/', 'Be responsible for your own files.', '자기 파일에 책임을 지세요.', 9),
  (4, 2, 'significant', '중요한', 'adj', '/sɪɡˈnɪfɪkənt/', 'Small habits make a significant change.', '작은 습관이 중요한 변화를 만들어요.', 10),
  (5, 1, 'accommodate', '수용하다', 'v', '/əˈkɑːmədeɪt/', 'The hall can accommodate 200 people.', '그 강당은 200명을 수용할 수 있어요.', 1),
  (5, 1, 'accurate', '정확한', 'adj', '/ˈækjərət/', 'Accurate data leads to a good decision.', '정확한 데이터가 좋은 결정으로 이어져요.', 2),
  (5, 1, 'anticipate', '예상하다', 'v', '/ænˈtɪsɪpeɪt/', 'We anticipate more users next month.', '우리는 다음 달 사용자가 더 많을 것으로 예상해요.', 3),
  (5, 1, 'coherent', '일관성 있는', 'adj', '/koʊˈhɪrənt/', 'Write a coherent paragraph.', '일관성 있는 문단을 쓰세요.', 4),
  (5, 1, 'consequence', '결과', 'n', '/ˈkɑːnsɪkwens/', 'Every choice has a consequence.', '모든 선택에는 결과가 따라요.', 5),
  (5, 1, 'controversial', '논란이 많은', 'adj', '/ˌkɑːntrəˈvɜːrʃl/', 'The rule was controversial at first.', '그 규칙은 처음에 논란이 많았어요.', 6),
  (5, 1, 'demonstrate', '입증하다', 'v', '/ˈdemənstreɪt/', 'The test demonstrates your progress.', '그 시험은 네 발전을 입증해요.', 7),
  (5, 1, 'deteriorate', '악화되다', 'v', '/dɪˈtɪriəreɪt/', 'Without practice, skills deteriorate.', '연습이 없으면 실력이 악화돼요.', 8),
  (5, 1, 'elaborate', '자세히 설명하다', 'v', '/ɪˈlæbəreɪt/', 'Could you elaborate on that idea?', '그 아이디어를 자세히 설명해 줄래요?', 9),
  (5, 1, 'inevitable', '불가피한', 'adj', '/ɪnˈevɪtəbl/', 'Some errors are inevitable at first.', '처음에는 어느 정도 오류가 불가피해요.', 10),
  (5, 2, 'interpret', '해석하다', 'v', '/ɪnˈtɜːrprət/', 'Interpret the graph in your own words.', '그래프를 네 말로 해석해 봐요.', 1),
  (5, 2, 'legitimate', '합법적인', 'adj', '/lɪˈdʒɪtɪmət/', 'Use legitimate sources for your report.', '보고서에는 합법적인 출처를 쓰세요.', 2),
  (5, 2, 'mitigate', '완화하다', 'v', '/ˈmɪtɪɡeɪt/', 'Good planning can mitigate the risk.', '좋은 계획은 위험을 완화할 수 있어요.', 3),
  (5, 2, 'notion', '개념', 'n', '/ˈnoʊʃn/', 'He questioned the notion of easy success.', '그는 쉬운 성공이라는 개념에 의문을 품었어요.', 4),
  (5, 2, 'perceive', '인식하다', 'v', '/pərˈsiːv/', 'People perceive colors differently.', '사람들은 색을 다르게 인식해요.', 5),
  (5, 2, 'persistent', '끈질긴', 'adj', '/pərˈsɪstənt/', 'A persistent student never gives up.', '끈질긴 학생은 포기하지 않아요.', 6),
  (5, 2, 'profound', '심오한', 'adj', '/prəˈfaʊnd/', 'The book had a profound effect on me.', '그 책은 나에게 심오한 영향을 주었어요.', 7),
  (5, 2, 'reluctant', '꺼리는', 'adj', '/rɪˈlʌktənt/', 'He was reluctant to speak first.', '그는 먼저 말하기를 꺼렸어요.', 8),
  (5, 2, 'sustain', '지속하다', 'v', '/səˈsteɪn/', 'Sustain your focus for ten minutes.', '십 분 동안 집중을 지속해 보세요.', 9),
  (5, 2, 'versatile', '다재다능한', 'adj', '/ˈvɜːrsətl/', 'Python is a versatile language.', '파이썬은 다재다능한 언어예요.', 10)
) as v(level, day_index, word, meaning, pos, ipa, example, example_ko, order_no)
join public.word_sets ws on ws.level = v.level and ws.day_index = v.day_index
on conflict (set_id, word) do nothing;

insert into public.shop_items (name, price, emoji, sort_no)
select v.name, v.price, v.emoji, v.sort_no
from (values
  ('츄파춥스', 300, '🍭', 1),
  ('바나나맛 우유', 1500, '🥛', 2),
  ('CU 모바일금액권 3,000원', 3000, '🎟️', 3),
  ('배스킨라빈스 싱글레귤러', 3900, '🍦', 4)
) as v(name, price, emoji, sort_no)
where not exists (select 1 from public.shop_items s where s.name = v.name);

-- 오늘의 미션 배정 (학생 레벨에 맞는 세트)
insert into public.assignments (student_id, set_id)
select s.id, ws.id
from public.students s
join public.word_sets ws on ws.level = s.level and ws.day_index = 1
on conflict (student_id, set_id) do nothing;

-- 참고 자료실 기본 배정 — 파이썬, 현재 주차는 1주차 1회차
insert into public.material_assignments (student_id, track, week, session)
select s.id, 'python', 1, 1
from public.students s
on conflict (student_id) do nothing;
