/**
 * 앱 안에서 이동한 횟수 기록.
 * window.history.length는 앱 밖(다른 사이트, 빈 탭) 기록까지 세므로 뒤로가기 판단에 쓸 수 없다.
 */
let visitedCount = 0;

export function recordNavigation() {
  visitedCount += 1;
}

/** 앱 안에서 한 번이라도 이동했으면 true */
export function canGoBackInApp() {
  return visitedCount > 1;
}
