// DB 연결 전 프론트엔드와 API 연결을 확인하기 위한 임시 데이터입니다.
const restaurants = [
  {
    id: 1,
    name: '든든한 한끼',
    category: '한식',
    deliveryFee: 2500,
    minimumOrderAmount: 10000,
    menus: [
      { id: 101, name: '제육덮밥', description: '매콤한 제육과 따뜻한 밥', price: 9500 },
      { id: 102, name: '김치찌개', description: '돼지고기를 넣고 푹 끓인 김치찌개', price: 9000 },
      { id: 103, name: '계란말이', description: '부드럽게 말아낸 계란말이', price: 5000 },
    ],
  },
  {
    id: 2,
    name: '바삭치킨',
    category: '치킨',
    deliveryFee: 2500,
    minimumOrderAmount: 18000,
    menus: [
      { id: 201, name: '후라이드치킨', description: '겉은 바삭하고 속은 촉촉한 기본 치킨', price: 18000 },
      { id: 202, name: '양념치킨', description: '달콤하고 매콤한 양념 치킨', price: 19000 },
      { id: 203, name: '감자튀김', description: '치킨과 함께 먹기 좋은 바삭한 감자', price: 4000 },
    ],
  },
  {
    id: 3,
    name: '동네피자',
    category: '피자',
    deliveryFee: 2500,
    minimumOrderAmount: 16000,
    menus: [
      { id: 301, name: '마르게리타 피자', description: '토마토와 모차렐라, 바질의 조합', price: 16000 },
      { id: 302, name: '페퍼로니 피자', description: '짭짤한 페퍼로니를 가득 올린 피자', price: 18000 },
      { id: 303, name: '치즈 오븐 파스타', description: '토마토소스와 치즈를 듬뿍 넣은 파스타', price: 8000 },
    ],
  },
];

module.exports = restaurants;
