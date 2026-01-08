# layout-topbar_fullwidth 구현 계획

## 📋 현재 상태 분석

### ✅ 이미 구현된 부분
1. **기본 구조** (`DynamicNavigation.tsx` 249-298 라인)
   - `topbar_fullwidth` 레이아웃 JSX 구조 완성
   - `HorizontalNavigationMenu` 컴포넌트 사용
   - `FullMenu` (Mega Menu) 컴포넌트 통합

2. **기본 스타일** (`DynamicNavigation.scss` 1325-1843 라인)
   - `.nav-topbar` 기본 스타일 (fixed position, 전체 너비)
   - `.nav-topbar-inner` 레이아웃 (max-width: 1400px)
   - `.nav-topbar-left`, `.nav-topbar-center`, `.nav-topbar-right` 영역
   - `.horizontal-menu-depth-0` 및 서브메뉴 스타일
   - 드롭다운 애니메이션

### ⚠️ 개선/추가 필요한 부분

#### 1. **Mega Menu 스타일 추가**
   - `horizontal` 레이아웃에는 `.mega-menu` 스타일이 있음 (1288-1323 라인)
   - `topbar_fullwidth`에는 해당 스타일이 누락됨
   - **필요 작업**: `.layout-topbar_fullwidth .mega-menu` 스타일 추가

#### 2. **로그아웃 버튼 스타일 명시**
   - `horizontal` 레이아웃에는 `.nav-logout-btn-horizontal` 스타일이 명시적으로 정의됨 (1124-1176 라인)
   - `topbar_fullwidth`에는 해당 스타일이 상속에 의존
   - **필요 작업**: `topbar_fullwidth`에 로그아웃 버튼 스타일 명시적 추가

#### 3. **nav-topbar-inner max-width 조정**
   - 현재 `max-width: 1400px`로 제한됨 (1352 라인)
   - 전체 너비 레이아웃의 목적에 맞게 조정 필요
   - **옵션 A**: `max-width: 100%` 또는 제거하여 진짜 전체 너비 사용
   - **옵션 B**: 더 큰 max-width 값 사용 (예: 1920px)

#### 4. **페이지 콘텐츠 여백 처리**
   - `topbar_fullwidth`는 `position: fixed`로 상단에 고정됨
   - 페이지 콘텐츠가 topbar 아래에 표시되도록 여백 필요
   - **필요 작업**: body 또는 페이지 컨테이너에 `padding-top` 또는 `margin-top` 추가

#### 5. **반응형 디자인**
   - 모바일/태블릿에서의 동작 확인
   - 햄버거 메뉴 동작 검증

## 🎯 구현 단계

### Phase 1: 누락된 스타일 추가
1. `.layout-topbar_fullwidth .mega-menu` 스타일 추가
2. `.layout-topbar_fullwidth .nav-logout-btn-horizontal` 스타일 명시적 추가

### Phase 2: 레이아웃 최적화
1. `nav-topbar-inner`의 `max-width` 조정 검토
2. 페이지 콘텐츠 여백 처리 (body padding-top)

### Phase 3: 테스트 및 검증
1. 드롭다운 메뉴 동작 확인
2. Mega Menu 동작 확인
3. 반응형 동작 확인
4. z-index 레이어링 확인

## 📝 상세 구현 내용

### 1. Mega Menu 스타일 추가
```scss
&.layout-topbar_fullwidth {
  .mega-menu {
    width: 100%;
    position: fixed; // topbar 아래에 고정
    top: var(--topbar-height);
    left: 0;
    right: 0;
    background: #fff;
    border-top: 1px solid #eee;
    font-weight: 500;
    z-index: 999; // topbar보다 낮게

    .mega-submenu-area {
      position: relative;
      display: block;
      width: 100%;
      min-height: 100px;
      padding: 16px 0;
    }

    .mega-submenu-column {
      .mega-submenu {
        list-style: none;
        margin: 0;
        padding: 0 16px;

        .mega-submenu-item {
          background: none;
          border: none;
          padding: 8px;
          cursor: pointer;
          color: var(--text-secondary);

          &:hover {
            color: var(--theme-color);
          }
        }
      }
    }
  }
}
```

### 2. 로그아웃 버튼 스타일 추가
```scss
&.layout-topbar_fullwidth {
  .nav-topbar-right {
    .nav-logout-btn-horizontal {
      // horizontal 레이아웃과 동일한 스타일
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
      // ... (horizontal과 동일)
    }
  }
}
```

### 3. nav-topbar-inner max-width 조정
```scss
.nav-topbar-inner {
  // 옵션 A: 전체 너비 사용
  max-width: 100%;
  
  // 옵션 B: 더 큰 max-width 사용
  // max-width: 1920px;
  
  // 옵션 C: 중앙 정렬을 위한 margin
  // margin: 0 auto;
}
```

### 4. 페이지 콘텐츠 여백 처리
```scss
// 전역 스타일 또는 별도 처리 필요
:global(body) {
  &.layout-topbar_fullwidth {
    padding-top: var(--topbar-height);
  }
}
```

## 🔍 검증 체크리스트

- [ ] Topbar가 화면 상단에 고정되어 있는가?
- [ ] 드롭다운 메뉴가 정상적으로 표시되는가?
- [ ] Mega Menu가 topbar 아래에 정상적으로 표시되는가?
- [ ] 페이지 콘텐츠가 topbar 아래에 표시되는가?
- [ ] 로그아웃 버튼이 정상적으로 표시되는가?
- [ ] 햄버거 버튼이 정상적으로 동작하는가?
- [ ] z-index 레이어링이 올바른가?
- [ ] 반응형 디자인이 작동하는가?

