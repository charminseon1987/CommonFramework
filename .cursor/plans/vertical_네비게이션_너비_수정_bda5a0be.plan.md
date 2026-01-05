---
name: Vertical 네비게이션 너비 수정
overview: Vertical 레이아웃의 사이드바가 전체 화면 너비를 차지하는 문제를 해결하기 위해 `.nav-sidebar`에 고정 너비를 설정하고, 컨테이너의 너비도 제한합니다.
todos:
  - id: add-nav-sidebar-styles
    content: ".nav-sidebar에 고정 너비 스타일 추가 (width: var(--sidebar-width))"
    status: completed
  - id: add-layout-vertical-width
    content: .layout-vertical 컨테이너에 너비 제한 추가
    status: completed
  - id: add-collapsed-width
    content: collapsed 상태일 때의 너비 설정 추가
    status: completed
    dependencies:
      - add-nav-sidebar-styles
  - id: verify-width-fix
    content: 변경 사항이 올바르게 적용되었는지 확인
    status: completed
    dependencies:
      - add-nav-sidebar-styles
      - add-layout-vertical-width
      - add-collapsed-width
---

# Vertical 네비게이션 너비 수정

## 문제 분석

- `.nav-sidebar`에 대한 너비 스타일이 없어 기본적으로 전체 너비를 차지함
- `--sidebar-width: 260px` 변수는 정의되어 있지만 실제로 사용되지 않음
- `.bangarlab-navigation.layout-vertical` 컨테이너도 너비 제한이 없음

## 수정 계획

### 1. `.nav-sidebar` 스타일 추가

- 위치: `src/ui/DynamicNavigation.scss`의 `.layout-vertical` 섹션 내부 또는 루트 레벨
- 고정 너비 설정: `width: var(--sidebar-width);`
- 최대 너비 제한: `max-width: var(--sidebar-width);`
- 높이 설정: `height: 100vh;` 또는 `height: 100%;`
- 위치 설정: 필요시 `position: fixed;` 또는 `position: relative;`

### 2. `.bangarlab-navigation.layout-vertical` 컨테이너 너비 제한

- 컨테이너 너비를 사이드바 너비에 맞춤
- `width: var(--sidebar-width);` 또는 `max-width: var(--sidebar-width);`

### 3. Collapsed 상태 처리

- 접힌 상태일 때는 더 작은 너비 적용
- 예: `&.collapsed { width: 60px; }` 또는 적절한 값

## 구체적 변경 내용

1. **`.nav-sidebar` 스타일 추가** (`src/ui/DynamicNavigation.scss`):
   ```scss
         .nav-sidebar {
             width: var(--sidebar-width);
             max-width: var(--sidebar-width);
             min-width: var(--sidebar-width);
             height: 100vh;
             // 기타 필요한 스타일
         }
   ```




2. **`.layout-vertical` 컨테이너 스타일**:
   ```scss
         &.layout-vertical {
             width: var(--sidebar-width);
             max-width: var(--sidebar-width);
             
             &.collapsed {
                 width: 60px; // 또는 적절한 값
                 .nav-sidebar {
                     width: 60px;
                 }
             }
         }
   ```