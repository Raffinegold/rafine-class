"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/data/seed.ts
var seed_exports = {};
__export(seed_exports, {
  DEFAULT_CASH_DAILY_LIMIT: () => DEFAULT_CASH_DAILY_LIMIT,
  LEVEL1_WORD_COUNT: () => LEVEL1_WORD_COUNT,
  SEED_ADMIN_PIN: () => SEED_ADMIN_PIN,
  SEED_DEMO_PINS: () => SEED_DEMO_PINS,
  SEED_SHOP_ITEMS: () => SEED_SHOP_ITEMS,
  SEED_STUDENTS: () => SEED_STUDENTS,
  SEED_WALLET_BALANCES: () => SEED_WALLET_BALANCES,
  SEED_WORDS: () => SEED_WORDS,
  SEED_WORD_SETS: () => SEED_WORD_SETS,
  seedCodingWrongNotes: () => seedCodingWrongNotes,
  seedRedemptions: () => seedRedemptions,
  seedWallets: () => seedWallets
});
module.exports = __toCommonJS(seed_exports);
var L1 = [
  ["apple", "\uC0AC\uACFC", "n", "/\u02C8\xE6pl/", "I eat an apple after coding class.", "\uB098\uB294 \uCF54\uB529 \uC218\uC5C5\uC774 \uB05D\uB098\uBA74 \uC0AC\uACFC\uB97C \uBA39\uC5B4\uC694."],
  ["book", "\uCC45", "n", "/b\u028Ak/", "This book is about robots.", "\uC774 \uCC45\uC740 \uB85C\uBD07\uC5D0 \uAD00\uD55C \uCC45\uC774\uC5D0\uC694."],
  ["cat", "\uACE0\uC591\uC774", "n", "/k\xE6t/", "The cat sleeps on my keyboard.", "\uACE0\uC591\uC774\uAC00 \uB0B4 \uD0A4\uBCF4\uB4DC \uC704\uC5D0\uC11C \uC790\uC694."],
  ["dog", "\uAC1C", "n", "/d\u0254\u02D0\u0261/", "My dog waits at the door.", "\uC6B0\uB9AC \uAC1C\uAC00 \uBB38 \uC55E\uC5D0\uC11C \uAE30\uB2E4\uB824\uC694."],
  ["egg", "\uB2EC\uAC40", "n", "/e\u0261/", "I boil an egg for breakfast.", "\uB098\uB294 \uC544\uCE68\uC5D0 \uB2EC\uAC40\uC744 \uC0B6\uC544\uC694."],
  ["fish", "\uBB3C\uACE0\uAE30", "n", "/f\u026A\u0283/", "The fish swims in the tank.", "\uBB3C\uACE0\uAE30\uAC00 \uC218\uC870 \uC548\uC5D0\uC11C \uD5E4\uC5C4\uCCD0\uC694."],
  ["girl", "\uC18C\uB140", "n", "/\u0261\u025C\u02D0rl/", "The girl draws a game map.", "\uADF8 \uC18C\uB140\uB294 \uAC8C\uC784 \uC9C0\uB3C4\uB97C \uADF8\uB824\uC694."],
  ["hand", "\uC190", "n", "/h\xE6nd/", "Raise your hand to answer.", "\uB300\uB2F5\uD558\uB824\uBA74 \uC190\uC744 \uB4E4\uC5B4\uC694."],
  ["ice", "\uC5BC\uC74C", "n", "/a\u026As/", "Put some ice in the water.", "\uBB3C\uC5D0 \uC5BC\uC74C\uC744 \uC880 \uB123\uC5B4\uC694."],
  ["jump", "\uB6F0\uB2E4", "v", "/d\u0292\u028Cmp/", "The rabbit can jump high.", "\uD1A0\uB07C\uB294 \uB192\uC774 \uB6F8 \uC218 \uC788\uC5B4\uC694."],
  ["key", "\uC5F4\uC1E0", "n", "/ki\u02D0/", "I lost my classroom key.", "\uB098\uB294 \uAD50\uC2E4 \uC5F4\uC1E0\uB97C \uC783\uC5B4\uBC84\uB838\uC5B4\uC694."],
  ["milk", "\uC6B0\uC720", "n", "/m\u026Alk/", "Drink milk every morning.", "\uB9E4\uC77C \uC544\uCE68 \uC6B0\uC720\uB97C \uB9C8\uC154\uC694."],
  ["nose", "\uCF54", "n", "/no\u028Az/", "The puppy has a wet nose.", "\uAC15\uC544\uC9C0\uC758 \uCF54\uB294 \uC816\uC5B4 \uC788\uC5B4\uC694."],
  ["open", "\uC5F4\uB2E4", "v", "/\u02C8o\u028Ap\u0259n/", "Open the window, please.", "\uCC3D\uBB38\uC744 \uC5F4\uC5B4 \uC8FC\uC138\uC694."],
  ["pencil", "\uC5F0\uD544", "n", "/\u02C8pensl/", "Write your name with a pencil.", "\uC5F0\uD544\uB85C \uC774\uB984\uC744 \uC368\uC694."],
  ["rain", "\uBE44", "n", "/re\u026An/", "The rain stops at noon.", "\uBE44\uAC00 \uC815\uC624\uC5D0 \uADF8\uCCD0\uC694."],
  ["sun", "\uD574", "n", "/s\u028Cn/", "The sun is bright today.", "\uC624\uB298\uC740 \uD574\uAC00 \uBC1D\uC544\uC694."],
  ["tree", "\uB098\uBB34", "n", "/tri\u02D0/", "A bird sits in the tree.", "\uC0C8\uAC00 \uB098\uBB34\uC5D0 \uC549\uC544 \uC788\uC5B4\uC694."],
  ["water", "\uBB3C", "n", "/\u02C8w\u0254\u02D0t\u0259r/", "Please bring me some water.", "\uBB3C \uC880 \uAC00\uC838\uB2E4 \uC8FC\uC138\uC694."],
  ["yellow", "\uB178\uB780", "adj", "/\u02C8jelo\u028A/", "She wears a yellow shirt.", "\uADF8\uB140\uB294 \uB178\uB780 \uC154\uCE20\uB97C \uC785\uC5B4\uC694."]
];
var L2 = [
  ["animal", "\uB3D9\uBB3C", "n", "/\u02C8\xE6n\u026Aml/", "The zoo has many animals.", "\uB3D9\uBB3C\uC6D0\uC5D0\uB294 \uB3D9\uBB3C\uC774 \uB9CE\uC544\uC694."],
  ["because", "\uC65C\uB0D0\uD558\uBA74", "conj", "/b\u026A\u02C8k\u0254\u02D0z/", "I like coding because it is fun.", "\uCF54\uB529\uC774 \uC7AC\uBBF8\uC788\uC5B4\uC11C \uC88B\uC544\uD574\uC694."],
  ["climb", "\uC624\uB974\uB2E4", "v", "/kla\u026Am/", "We climb the hill on Saturdays.", "\uC6B0\uB9AC\uB294 \uD1A0\uC694\uC77C\uB9C8\uB2E4 \uC5B8\uB355\uC5D0 \uC62C\uB77C\uC694."],
  ["country", "\uB098\uB77C", "n", "/\u02C8k\u028Cntri/", "Korea is my country.", "\uD55C\uAD6D\uC740 \uB0B4 \uB098\uB77C\uC608\uC694."],
  ["dinner", "\uC800\uB141 \uC2DD\uC0AC", "n", "/\u02C8d\u026An\u0259r/", "We have dinner at seven.", "\uC6B0\uB9AC\uB294 7\uC2DC\uC5D0 \uC800\uB141\uC744 \uBA39\uC5B4\uC694."],
  ["easy", "\uC26C\uC6B4", "adj", "/\u02C8i\u02D0zi/", "This game is easy for beginners.", "\uC774 \uAC8C\uC784\uC740 \uCD08\uBCF4\uC790\uC5D0\uAC8C \uC26C\uC6CC\uC694."],
  ["family", "\uAC00\uC871", "n", "/\u02C8f\xE6m\u0259li/", "My family watches movies together.", "\uC6B0\uB9AC \uAC00\uC871\uC740 \uD568\uAED8 \uC601\uD654\uB97C \uBD10\uC694."],
  ["finish", "\uB05D\uB0B4\uB2E4", "v", "/\u02C8f\u026An\u026A\u0283/", "Finish your homework first.", "\uC219\uC81C\uB97C \uBA3C\uC800 \uB05D\uB0B4\uC694."],
  ["garden", "\uC815\uC6D0", "n", "/\u02C8\u0261\u0251\u02D0rdn/", "Flowers grow in the garden.", "\uC815\uC6D0\uC5D0\uC11C \uAF43\uC774 \uC790\uB77C\uC694."],
  ["hungry", "\uBC30\uACE0\uD508", "adj", "/\u02C8h\u028C\u014B\u0261ri/", "I am hungry after class.", "\uC218\uC5C5 \uD6C4\uC5D0 \uBC30\uAC00 \uACE0\uD30C\uC694."],
  ["invite", "\uCD08\uB300\uD558\uB2E4", "v", "/\u026An\u02C8va\u026At/", "I invite my friends to my birthday.", "\uC0DD\uC77C\uC5D0 \uCE5C\uAD6C\uB4E4\uC744 \uCD08\uB300\uD574\uC694."],
  ["kitchen", "\uBD80\uC5CC", "n", "/\u02C8k\u026At\u0283\u026An/", "Mom is cooking in the kitchen.", "\uC5C4\uB9C8\uAC00 \uBD80\uC5CC\uC5D0\uC11C \uC694\uB9AC\uD574\uC694."],
  ["library", "\uB3C4\uC11C\uAD00", "n", "/\u02C8la\u026Abreri/", "I read books in the library.", "\uB3C4\uC11C\uAD00\uC5D0\uC11C \uCC45\uC744 \uC77D\uC5B4\uC694."],
  ["morning", "\uC544\uCE68", "n", "/\u02C8m\u0254\u02D0rn\u026A\u014B/", "I stretch every morning.", "\uB098\uB294 \uB9E4\uC77C \uC544\uCE68 \uAE30\uC9C0\uAC1C\uB97C \uCF1C\uC694."],
  ["picture", "\uADF8\uB9BC", "n", "/\u02C8p\u026Akt\u0283\u0259r/", "Draw a picture of your robot.", "\uB124 \uB85C\uBD07 \uADF8\uB9BC\uC744 \uADF8\uB824 \uBD10\uC694."],
  ["question", "\uC9C8\uBB38", "n", "/\u02C8kwest\u0283\u0259n/", "Ask a question if you are not sure.", "\uD655\uC2E4\uD558\uC9C0 \uC54A\uC73C\uBA74 \uC9C8\uBB38\uD558\uC138\uC694."],
  ["remember", "\uAE30\uC5B5\uD558\uB2E4", "v", "/r\u026A\u02C8memb\u0259r/", "Remember to save your file.", "\uD30C\uC77C \uC800\uC7A5\uD558\uB294 \uAC78 \uAE30\uC5B5\uD574\uC694."],
  ["strong", "\uD798\uC13C", "adj", "/str\u0254\u02D0\u014B/", "He is strong enough to carry it.", "\uADF8\uB294 \uADF8\uAC83\uC744 \uB4E4 \uB9CC\uD07C \uD798\uC774 \uC138\uC694."],
  ["together", "\uD568\uAED8", "adv", "/t\u0259\u02C8\u0261e\xF0\u0259r/", "We study English together.", "\uC6B0\uB9AC\uB294 \uD568\uAED8 \uC601\uC5B4\uB97C \uACF5\uBD80\uD574\uC694."],
  ["weather", "\uB0A0\uC528", "n", "/\u02C8we\xF0\u0259r/", "The weather is cold today.", "\uC624\uB298 \uB0A0\uC528\uAC00 \uCD94\uC6CC\uC694."]
];
var L3 = [
  ["borrow", "\uBE4C\uB9AC\uB2E4", "v", "/\u02C8b\u0251\u02D0ro\u028A/", "Can I borrow your charger?", "\uCDA9\uC804\uAE30\uB97C \uBE4C\uB824\uB3C4 \uB420\uAE4C\uC694?"],
  ["careful", "\uC870\uC2EC\uC2A4\uB7EC\uC6B4", "adj", "/\u02C8kerfl/", "Be careful with the glass.", "\uC720\uB9AC\uC794\uC744 \uC870\uC2EC\uD788 \uB2E4\uB904\uC694."],
  ["decide", "\uACB0\uC815\uD558\uB2E4", "v", "/d\u026A\u02C8sa\u026Ad/", "We decide the game topic today.", "\uC6B0\uB9AC\uB294 \uC624\uB298 \uAC8C\uC784 \uC8FC\uC81C\uB97C \uC815\uD574\uC694."],
  ["describe", "\uBB18\uC0AC\uD558\uB2E4", "v", "/d\u026A\u02C8skra\u026Ab/", "Describe your favorite place in English.", "\uC88B\uC544\uD558\uB294 \uC7A5\uC18C\uB97C \uC601\uC5B4\uB85C \uBB18\uC0AC\uD574 \uBD10\uC694."],
  ["environment", "\uD658\uACBD", "n", "/\u026An\u02C8va\u026Ar\u0259nm\u0259nt/", "We should protect the environment.", "\uC6B0\uB9AC\uB294 \uD658\uACBD\uC744 \uBCF4\uD638\uD574\uC57C \uD574\uC694."],
  ["famous", "\uC720\uBA85\uD55C", "adj", "/\u02C8fe\u026Am\u0259s/", "This academy is famous in Cheonan.", "\uC774 \uD559\uC6D0\uC740 \uCC9C\uC548\uC5D0\uC11C \uC720\uBA85\uD574\uC694."],
  ["honest", "\uC815\uC9C1\uD55C", "adj", "/\u02C8\u0251\u02D0n\u026Ast/", "An honest answer is always better.", "\uC815\uC9C1\uD55C \uB300\uB2F5\uC774 \uD56D\uC0C1 \uB354 \uC88B\uC544\uC694."],
  ["instead", "\uB300\uC2E0\uC5D0", "adv", "/\u026An\u02C8sted/", "Let's use a loop instead.", "\uB300\uC2E0 \uBC18\uBCF5\uBB38\uC744 \uC368 \uBD10\uC694."],
  ["introduce", "\uC18C\uAC1C\uD558\uB2E4", "v", "/\u02CC\u026Antr\u0259\u02C8du\u02D0s/", "Introduce yourself to the new student.", "\uC0C8 \uD559\uC0DD\uC5D0\uAC8C \uC790\uC2E0\uC744 \uC18C\uAC1C\uD574\uC694."],
  ["journey", "\uC5EC\uD589", "n", "/\u02C8d\u0292\u025C\u02D0rni/", "The journey to Seoul takes two hours.", "\uC11C\uC6B8\uAE4C\uC9C0 \uAC00\uB294 \uC5EC\uC815\uC740 \uB450 \uC2DC\uAC04 \uAC78\uB824\uC694."],
  ["mistake", "\uC2E4\uC218", "n", "/m\u026A\u02C8ste\u026Ak/", "A mistake helps you learn.", "\uC2E4\uC218\uB294 \uBC30\uC6C0\uC744 \uB3C4\uC640\uC694."],
  ["necessary", "\uD544\uC694\uD55C", "adj", "/\u02C8nes\u0259seri/", "Water is necessary for life.", "\uBB3C\uC740 \uC0B6\uC5D0 \uD544\uC694\uD574\uC694."],
  ["opinion", "\uC758\uACAC", "n", "/\u0259\u02C8p\u026Anj\u0259n/", "Share your opinion with the team.", "\uD300\uC5D0\uAC8C \uB124 \uC758\uACAC\uC744 \uB098\uB220 \uBD10\uC694."],
  ["possible", "\uAC00\uB2A5\uD55C", "adj", "/\u02C8p\u0251\u02D0s\u0259bl/", "Is it possible to finish today?", "\uC624\uB298 \uB05D\uB0B4\uB294 \uAC8C \uAC00\uB2A5\uD55C\uAC00\uC694?"],
  ["prepare", "\uC900\uBE44\uD558\uB2E4", "v", "/pr\u026A\u02C8per/", "Prepare your presentation for Friday.", "\uAE08\uC694\uC77C \uBC1C\uD45C\uB97C \uC900\uBE44\uD558\uC138\uC694."],
  ["protect", "\uBCF4\uD638\uD558\uB2E4", "v", "/pr\u0259\u02C8tekt/", "Sunglasses protect your eyes.", "\uC120\uAE00\uB77C\uC2A4\uB294 \uB208\uC744 \uBCF4\uD638\uD574\uC694."],
  ["reason", "\uC774\uC720", "n", "/\u02C8ri\u02D0zn/", "Tell me the reason you chose it.", "\uADF8\uAC83\uC744 \uACE0\uB978 \uC774\uC720\uB97C \uB9D0\uD574 \uBD10\uC694."],
  ["suggest", "\uC81C\uC548\uD558\uB2E4", "v", "/s\u0259\u02C8d\u0292est/", "I suggest a simple design.", "\uAC04\uB2E8\uD55C \uB514\uC790\uC778\uC744 \uC81C\uC548\uD574\uC694."],
  ["trouble", "\uBB38\uC81C", "n", "/\u02C8tr\u028Cbl/", "Tell the teacher if you have trouble.", "\uBB38\uC81C\uAC00 \uC788\uC73C\uBA74 \uC120\uC0DD\uB2D8\uAED8 \uB9D0\uD574\uC694."],
  ["volunteer", "\uC790\uC6D0\uBD09\uC0AC\uC790", "n", "/\u02CCv\u0251\u02D0l\u0259n\u02C8t\u026Ar/", "She is a volunteer at the library.", "\uADF8\uB140\uB294 \uB3C4\uC11C\uAD00 \uC790\uC6D0\uBD09\uC0AC\uC790\uC608\uC694."]
];
var L4 = [
  ["achieve", "\uB2EC\uC131\uD558\uB2E4", "v", "/\u0259\u02C8t\u0283i\u02D0v/", "You can achieve your goal step by step.", "\uBAA9\uD45C\uB97C \uD55C \uAC78\uC74C\uC529 \uB2EC\uC131\uD560 \uC218 \uC788\uC5B4\uC694."],
  ["approach", "\uC811\uADFC\uBC95", "n", "/\u0259\u02C8pro\u028At\u0283/", "Try a different approach to the problem.", "\uBB38\uC81C\uC5D0 \uB2E4\uB978 \uC811\uADFC\uBC95\uC744 \uC2DC\uB3C4\uD574 \uBD10\uC694."],
  ["benefit", "\uC774\uC775", "n", "/\u02C8ben\u026Af\u026At/", "Daily review has a big benefit.", "\uB9E4\uC77C \uBCF5\uC2B5\uC740 \uD070 \uC774\uC775\uC774 \uC788\uC5B4\uC694."],
  ["compare", "\uBE44\uAD50\uD558\uB2E4", "v", "/k\u0259m\u02C8per/", "Compare the two results carefully.", "\uB450 \uACB0\uACFC\uB97C \uC8FC\uC758 \uAE4A\uAC8C \uBE44\uAD50\uD558\uC138\uC694."],
  ["consider", "\uACE0\uB824\uD558\uB2E4", "v", "/k\u0259n\u02C8s\u026Ad\u0259r/", "Consider the user before coding.", "\uCF54\uB529 \uC804\uC5D0 \uC0AC\uC6A9\uC790\uB97C \uACE0\uB824\uD558\uC138\uC694."],
  ["contribute", "\uAE30\uC5EC\uD558\uB2E4", "v", "/k\u0259n\u02C8tr\u026Abju\u02D0t/", "Everyone can contribute one idea.", "\uB204\uAD6C\uB098 \uC544\uC774\uB514\uC5B4 \uD558\uB098\uC529 \uAE30\uC5EC\uD560 \uC218 \uC788\uC5B4\uC694."],
  ["decrease", "\uAC10\uC18C\uD558\uB2E4", "v", "/d\u026A\u02C8kri\u02D0s/", "Errors decrease with practice.", "\uC5F0\uC2B5\uD558\uBA74 \uC624\uB958\uAC00 \uAC10\uC18C\uD574\uC694."],
  ["efficient", "\uD6A8\uC728\uC801\uC778", "adj", "/\u026A\u02C8f\u026A\u0283nt/", "This code is short and efficient.", "\uC774 \uCF54\uB4DC\uB294 \uC9E7\uACE0 \uD6A8\uC728\uC801\uC774\uC5D0\uC694."],
  ["encourage", "\uACA9\uB824\uD558\uB2E4", "v", "/\u026An\u02C8k\u025C\u02D0r\u026Ad\u0292/", "Teachers encourage students to ask.", "\uC120\uC0DD\uB2D8\uC740 \uD559\uC0DD\uB4E4\uC774 \uC9C8\uBB38\uD558\uB3C4\uB85D \uACA9\uB824\uD574\uC694."],
  ["establish", "\uC124\uB9BD\uD558\uB2E4", "v", "/\u026A\u02C8st\xE6bl\u026A\u0283/", "They establish a new club.", "\uADF8\uB4E4\uC740 \uC0C8 \uB3D9\uC544\uB9AC\uB97C \uC124\uB9BD\uD574\uC694."],
  ["evidence", "\uC99D\uAC70", "n", "/\u02C8ev\u026Ad\u0259ns/", "Find evidence before you decide.", "\uACB0\uC815\uD558\uAE30 \uC804\uC5D0 \uC99D\uAC70\uB97C \uCC3E\uC544\uC694."],
  ["independent", "\uB3C5\uB9BD\uC801\uC778", "adj", "/\u02CC\u026And\u026A\u02C8pend\u0259nt/", "She is an independent learner.", "\uADF8\uB140\uB294 \uB3C5\uB9BD\uC801\uC778 \uD559\uC2B5\uC790\uC608\uC694."],
  ["influence", "\uC601\uD5A5", "n", "/\u02C8\u026Anflu\u0259ns/", "Friends have a strong influence on us.", "\uCE5C\uAD6C\uB294 \uC6B0\uB9AC\uC5D0\uAC8C \uD070 \uC601\uD5A5\uC744 \uC918\uC694."],
  ["maintain", "\uC720\uC9C0\uD558\uB2E4", "v", "/me\u026An\u02C8te\u026An/", "Maintain a steady study routine.", "\uAFB8\uC900\uD55C \uACF5\uBD80 \uC2B5\uAD00\uC744 \uC720\uC9C0\uD558\uC138\uC694."],
  ["opportunity", "\uAE30\uD68C", "n", "/\u02CC\u0251\u02D0p\u0259r\u02C8tu\u02D0n\u0259ti/", "This contest is a good opportunity.", "\uC774 \uB300\uD68C\uB294 \uC88B\uC740 \uAE30\uD68C\uC608\uC694."],
  ["participate", "\uCC38\uC5EC\uD558\uB2E4", "v", "/p\u0251\u02D0r\u02C8t\u026As\u026Ape\u026At/", "All students participate in the demo day.", "\uBAA8\uB4E0 \uD559\uC0DD\uC774 \uC2DC\uC5F0\uD68C\uC5D0 \uCC38\uC5EC\uD574\uC694."],
  ["purpose", "\uBAA9\uC801", "n", "/\u02C8p\u025C\u02D0rp\u0259s/", "What is the purpose of this app?", "\uC774 \uC571\uC758 \uBAA9\uC801\uC740 \uBB34\uC5C7\uC778\uAC00\uC694?"],
  ["require", "\uC694\uAD6C\uD558\uB2E4", "v", "/r\u026A\u02C8kwa\u026A\u0259r/", "This project requires teamwork.", "\uC774 \uD504\uB85C\uC81D\uD2B8\uB294 \uD611\uB3D9\uC744 \uC694\uAD6C\uD574\uC694."],
  ["responsible", "\uCC45\uC784 \uC788\uB294", "adj", "/r\u026A\u02C8sp\u0251\u02D0ns\u0259bl/", "Be responsible for your own files.", "\uC790\uAE30 \uD30C\uC77C\uC5D0 \uCC45\uC784\uC744 \uC9C0\uC138\uC694."],
  ["significant", "\uC911\uC694\uD55C", "adj", "/s\u026A\u0261\u02C8n\u026Af\u026Ak\u0259nt/", "Small habits make a significant change.", "\uC791\uC740 \uC2B5\uAD00\uC774 \uC911\uC694\uD55C \uBCC0\uD654\uB97C \uB9CC\uB4E4\uC5B4\uC694."]
];
var L5 = [
  ["accommodate", "\uC218\uC6A9\uD558\uB2E4", "v", "/\u0259\u02C8k\u0251\u02D0m\u0259de\u026At/", "The hall can accommodate 200 people.", "\uADF8 \uAC15\uB2F9\uC740 200\uBA85\uC744 \uC218\uC6A9\uD560 \uC218 \uC788\uC5B4\uC694."],
  ["accurate", "\uC815\uD655\uD55C", "adj", "/\u02C8\xE6kj\u0259r\u0259t/", "Accurate data leads to a good decision.", "\uC815\uD655\uD55C \uB370\uC774\uD130\uAC00 \uC88B\uC740 \uACB0\uC815\uC73C\uB85C \uC774\uC5B4\uC838\uC694."],
  ["anticipate", "\uC608\uC0C1\uD558\uB2E4", "v", "/\xE6n\u02C8t\u026As\u026Ape\u026At/", "We anticipate more users next month.", "\uC6B0\uB9AC\uB294 \uB2E4\uC74C \uB2EC \uC0AC\uC6A9\uC790\uAC00 \uB354 \uB9CE\uC744 \uAC83\uC73C\uB85C \uC608\uC0C1\uD574\uC694."],
  ["coherent", "\uC77C\uAD00\uC131 \uC788\uB294", "adj", "/ko\u028A\u02C8h\u026Ar\u0259nt/", "Write a coherent paragraph.", "\uC77C\uAD00\uC131 \uC788\uB294 \uBB38\uB2E8\uC744 \uC4F0\uC138\uC694."],
  ["consequence", "\uACB0\uACFC", "n", "/\u02C8k\u0251\u02D0ns\u026Akwens/", "Every choice has a consequence.", "\uBAA8\uB4E0 \uC120\uD0DD\uC5D0\uB294 \uACB0\uACFC\uAC00 \uB530\uB77C\uC694."],
  ["controversial", "\uB17C\uB780\uC774 \uB9CE\uC740", "adj", "/\u02CCk\u0251\u02D0ntr\u0259\u02C8v\u025C\u02D0r\u0283l/", "The rule was controversial at first.", "\uADF8 \uADDC\uCE59\uC740 \uCC98\uC74C\uC5D0 \uB17C\uB780\uC774 \uB9CE\uC558\uC5B4\uC694."],
  ["demonstrate", "\uC785\uC99D\uD558\uB2E4", "v", "/\u02C8dem\u0259nstre\u026At/", "The test demonstrates your progress.", "\uADF8 \uC2DC\uD5D8\uC740 \uB124 \uBC1C\uC804\uC744 \uC785\uC99D\uD574\uC694."],
  ["deteriorate", "\uC545\uD654\uB418\uB2E4", "v", "/d\u026A\u02C8t\u026Ari\u0259re\u026At/", "Without practice, skills deteriorate.", "\uC5F0\uC2B5\uC774 \uC5C6\uC73C\uBA74 \uC2E4\uB825\uC774 \uC545\uD654\uB3FC\uC694."],
  ["elaborate", "\uC790\uC138\uD788 \uC124\uBA85\uD558\uB2E4", "v", "/\u026A\u02C8l\xE6b\u0259re\u026At/", "Could you elaborate on that idea?", "\uADF8 \uC544\uC774\uB514\uC5B4\uB97C \uC790\uC138\uD788 \uC124\uBA85\uD574 \uC904\uB798\uC694?"],
  ["inevitable", "\uBD88\uAC00\uD53C\uD55C", "adj", "/\u026An\u02C8ev\u026At\u0259bl/", "Some errors are inevitable at first.", "\uCC98\uC74C\uC5D0\uB294 \uC5B4\uB290 \uC815\uB3C4 \uC624\uB958\uAC00 \uBD88\uAC00\uD53C\uD574\uC694."],
  ["interpret", "\uD574\uC11D\uD558\uB2E4", "v", "/\u026An\u02C8t\u025C\u02D0rpr\u0259t/", "Interpret the graph in your own words.", "\uADF8\uB798\uD504\uB97C \uB124 \uB9D0\uB85C \uD574\uC11D\uD574 \uBD10\uC694."],
  ["legitimate", "\uD569\uBC95\uC801\uC778", "adj", "/l\u026A\u02C8d\u0292\u026At\u026Am\u0259t/", "Use legitimate sources for your report.", "\uBCF4\uACE0\uC11C\uC5D0\uB294 \uD569\uBC95\uC801\uC778 \uCD9C\uCC98\uB97C \uC4F0\uC138\uC694."],
  ["mitigate", "\uC644\uD654\uD558\uB2E4", "v", "/\u02C8m\u026At\u026A\u0261e\u026At/", "Good planning can mitigate the risk.", "\uC88B\uC740 \uACC4\uD68D\uC740 \uC704\uD5D8\uC744 \uC644\uD654\uD560 \uC218 \uC788\uC5B4\uC694."],
  ["notion", "\uAC1C\uB150", "n", "/\u02C8no\u028A\u0283n/", "He questioned the notion of easy success.", "\uADF8\uB294 \uC26C\uC6B4 \uC131\uACF5\uC774\uB77C\uB294 \uAC1C\uB150\uC5D0 \uC758\uBB38\uC744 \uD488\uC5C8\uC5B4\uC694."],
  ["perceive", "\uC778\uC2DD\uD558\uB2E4", "v", "/p\u0259r\u02C8si\u02D0v/", "People perceive colors differently.", "\uC0AC\uB78C\uB4E4\uC740 \uC0C9\uC744 \uB2E4\uB974\uAC8C \uC778\uC2DD\uD574\uC694."],
  ["persistent", "\uB048\uC9C8\uAE34", "adj", "/p\u0259r\u02C8s\u026Ast\u0259nt/", "A persistent student never gives up.", "\uB048\uC9C8\uAE34 \uD559\uC0DD\uC740 \uD3EC\uAE30\uD558\uC9C0 \uC54A\uC544\uC694."],
  ["profound", "\uC2EC\uC624\uD55C", "adj", "/pr\u0259\u02C8fa\u028And/", "The book had a profound effect on me.", "\uADF8 \uCC45\uC740 \uB098\uC5D0\uAC8C \uC2EC\uC624\uD55C \uC601\uD5A5\uC744 \uC8FC\uC5C8\uC5B4\uC694."],
  ["reluctant", "\uAEBC\uB9AC\uB294", "adj", "/r\u026A\u02C8l\u028Ckt\u0259nt/", "He was reluctant to speak first.", "\uADF8\uB294 \uBA3C\uC800 \uB9D0\uD558\uAE30\uB97C \uAEBC\uB838\uC5B4\uC694."],
  ["sustain", "\uC9C0\uC18D\uD558\uB2E4", "v", "/s\u0259\u02C8ste\u026An/", "Sustain your focus for ten minutes.", "\uC2ED \uBD84 \uB3D9\uC548 \uC9D1\uC911\uC744 \uC9C0\uC18D\uD574 \uBCF4\uC138\uC694."],
  ["versatile", "\uB2E4\uC7AC\uB2E4\uB2A5\uD55C", "adj", "/\u02C8v\u025C\u02D0rs\u0259tl/", "Python is a versatile language.", "\uD30C\uC774\uC36C\uC740 \uB2E4\uC7AC\uB2E4\uB2A5\uD55C \uC5B8\uC5B4\uC608\uC694."]
];
var LEVEL_ROWS = { 1: L1, 2: L2, 3: L3, 4: L4, 5: L5 };
var SEED_STUDENTS = [
  {
    id: "stu-seoyeon",
    name: "\uAE40\uC11C\uC5F0",
    class_name: "\uCD08\uB4F1B",
    grade: 5,
    level: 3,
    tosel_level: "Basic",
    pin: "1111",
    nickname: "\uBCC4\uBE5B\uC11C\uC5F0",
    parent_token: "a1b2c3d4e5f60718293a4b5c6d7e8f90",
    active: true,
    created_at: "2026-11-02T09:00:00+09:00",
    last_seen_at: null,
    // TOSEL 영어 학습을 함께 켠 학생 — 첫 화면은 그래도 코딩이고, 위쪽에 📚 영어 토글이 보입니다
    coding_level: "C2",
    enabled_subjects: ["english", "coding"]
  },
  {
    id: "stu-junwoo",
    name: "\uBC15\uC900\uC6B0",
    class_name: "\uCD08\uB4F1B",
    grade: 6,
    level: 3,
    tosel_level: "Basic",
    pin: "2222",
    nickname: "\uCF54\uB529\uC900\uC6B0",
    parent_token: "b2c3d4e5f60718293a4b5c6d7e8f9012",
    active: true,
    created_at: "2026-11-02T09:10:00+09:00",
    last_seen_at: null,
    // 코딩 중심 학생 — 영어 토글 없이 코딩 화면만 (원장님이 관리 도구에서 켤 수 있음)
    coding_level: "C3",
    enabled_subjects: ["coding"]
  },
  {
    id: "stu-haeun",
    name: "\uC774\uD558\uC740",
    class_name: "\uCD08\uB4F1A",
    grade: 3,
    level: 2,
    tosel_level: "Starter",
    pin: "3333",
    nickname: "\uD558\uB298\uC774",
    parent_token: "c3d4e5f60718293a4b5c6d7e8f901234",
    active: true,
    created_at: "2026-11-03T10:00:00+09:00",
    last_seen_at: null,
    // 코딩만 수강 — 로그인하면 코딩 화면으로 바로 들어갑니다 (원장님 과목 권한 예시)
    coding_level: "C1",
    enabled_subjects: ["coding"]
  },
  {
    id: "stu-minjun",
    name: "\uCD5C\uBBFC\uC900",
    class_name: "\uC911\uB4F1A",
    grade: 7,
    level: 4,
    tosel_level: "Junior",
    pin: "4444",
    nickname: "\uBBFC\uC900\uAC8C\uC784",
    parent_token: "d4e5f60718293a4b5c6d7e8f90123456",
    active: true,
    created_at: "2026-11-04T11:00:00+09:00",
    last_seen_at: null,
    coding_level: "C4",
    enabled_subjects: ["coding"]
  },
  {
    id: "stu-yujin",
    name: "\uC815\uC720\uC9C4",
    class_name: "\uCD08\uB4F1A",
    grade: 2,
    level: 1,
    tosel_level: "Pre-Starter",
    pin: "5555",
    nickname: "\uC720\uC9C4\uBCC4",
    parent_token: "e5f60718293a4b5c6d7e8f9012345678",
    active: true,
    created_at: "2026-11-05T14:00:00+09:00",
    last_seen_at: null,
    // 영어만 수강 — 코딩 전환 버튼이 보이지 않는 예시
    coding_level: "C1",
    enabled_subjects: ["english"]
  }
];
var SEED_WORD_SETS = [1, 2, 3, 4, 5].flatMap((level) => [
  {
    id: `set-L${level}-D01`,
    name: `Level ${level} \xB7 Day 01`,
    level,
    day_index: 1,
    active: true,
    created_at: "2026-11-01T00:00:00+09:00"
  },
  {
    id: `set-L${level}-D02`,
    name: `Level ${level} \xB7 Day 02`,
    level,
    day_index: 2,
    active: true,
    created_at: "2026-11-01T00:00:00+09:00"
  }
]);
var SEED_WORDS = [1, 2, 3, 4, 5].flatMap((level) => {
  const rows = LEVEL_ROWS[level];
  return rows.map(([word, meaning, pos, ipa, example, example_ko], idx) => {
    const day = idx < 10 ? 1 : 2;
    return {
      id: `w-L${level}-${String(idx + 1).padStart(2, "0")}`,
      set_id: `set-L${level}-D${String(day).padStart(2, "0")}`,
      word,
      meaning,
      pos,
      ipa,
      example,
      example_ko,
      order_no: idx % 10 + 1
    };
  });
});
var SEED_ADMIN_PIN = "9999";
var DEFAULT_CASH_DAILY_LIMIT = 50;
var SEED_SHOP_ITEMS = [
  { id: "item-chupachups", name: "\uCE04\uD30C\uCDA5\uC2A4", price: 300, emoji: "\u{1F36D}", active: true, sort_no: 1, created_at: "2026-11-10T09:00:00+09:00" },
  { id: "item-banana-milk", name: "\uBC14\uB098\uB098\uB9DB \uC6B0\uC720", price: 1500, emoji: "\u{1F95B}", active: true, sort_no: 2, created_at: "2026-11-10T09:00:00+09:00" },
  { id: "item-cu-3000", name: "CU \uBAA8\uBC14\uC77C\uAE08\uC561\uAD8C 3,000\uC6D0", price: 3e3, emoji: "\u{1F39F}\uFE0F", active: true, sort_no: 3, created_at: "2026-11-10T09:00:00+09:00" },
  { id: "item-br-single", name: "\uBC30\uC2A4\uD0A8\uB77C\uBE48\uC2A4 \uC2F1\uAE00\uB808\uADE4\uB7EC", price: 3900, emoji: "\u{1F366}", active: true, sort_no: 4, created_at: "2026-11-10T09:00:00+09:00" }
];
var SEED_WALLET_BALANCES = {
  "stu-seoyeon": 1280,
  "stu-junwoo": 3300,
  // 아래 데모 대기 신청(츄파춥스 300원)을 이미 차감한 잔액
  "stu-haeun": 450,
  "stu-minjun": 2150,
  "stu-yujin": 120
};
function seedRedemptions(today) {
  return [
    {
      id: "rdm-demo-1",
      student_id: "stu-junwoo",
      item_id: "item-chupachups",
      item_name: "\uCE04\uD30C\uCDA5\uC2A4",
      price: 300,
      status: "pending",
      requested_at: `${today}T16:40:00+09:00`,
      handled_at: null
    },
    {
      id: "rdm-demo-2",
      student_id: "stu-seoyeon",
      item_id: "item-banana-milk",
      item_name: "\uBC14\uB098\uB098\uB9DB \uC6B0\uC720",
      price: 1500,
      status: "sent",
      requested_at: "2026-11-14T17:20:00+09:00",
      handled_at: "2026-11-15T09:10:00+09:00"
    }
  ];
}
function seedWallets(students, today) {
  return students.map((s) => ({
    student_id: s.id,
    cash_balance: SEED_WALLET_BALANCES[s.id] ?? 0,
    daily_cash_earned: 0,
    earned_date: today,
    updated_at: `${today}T09:00:00+09:00`
  }));
}
var SEED_DEMO_PINS = Object.fromEntries(
  SEED_STUDENTS.map((s) => [s.id, s.pin])
);
function seedCodingWrongNotes(today) {
  return [
    {
      student_id: "stu-seoyeon",
      problem_id: "c2-03",
      level: "C2",
      miss_count: 2,
      last_wrong_at: `${today}T17:20:00+09:00`,
      cleared_at: null
    },
    {
      student_id: "stu-seoyeon",
      problem_id: "c2-07",
      level: "C2",
      miss_count: 1,
      last_wrong_at: `${today}T17:24:00+09:00`,
      cleared_at: null
    },
    {
      student_id: "stu-junwoo",
      problem_id: "c3-02",
      level: "C3",
      miss_count: 1,
      last_wrong_at: `${today}T18:05:00+09:00`,
      cleared_at: null
    }
  ];
}
var LEVEL1_WORD_COUNT = L1.length;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DEFAULT_CASH_DAILY_LIMIT,
  LEVEL1_WORD_COUNT,
  SEED_ADMIN_PIN,
  SEED_DEMO_PINS,
  SEED_SHOP_ITEMS,
  SEED_STUDENTS,
  SEED_WALLET_BALANCES,
  SEED_WORDS,
  SEED_WORD_SETS,
  seedCodingWrongNotes,
  seedRedemptions,
  seedWallets
});
