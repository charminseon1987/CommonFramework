# Mendix Navigation vs Custom Widget 구동 방식 비교

## 개요

Mendix의 기본 Navigation과 Custom Widget에서 페이지를 여는 방식의 차이점과 올바른 구현 방법을 설명합니다.

---

## 1. 구동 방식 비교

### Mendix Navigation (기본 방식)

```javascript
[Navigation] Open a page with id: MyFirstModule/Home_Web.page.xml 
[Navigation] Open a page with id: PortalModule/MASTER.page.xml
```

**특징:**
- Mendix 내부 페이지 ID 시스템 사용
- `Module/PageName.page.xml` 형식
- Mendix 메타데이터 기반

### Custom Widget (현재 문제 방식)

```javascript
[Client] [Widget] Menu: MASTERPAEG | pageName:  | pageURL: /p/PortalModule/MASTER
[Client] [Widget] Menu: adminPage | pageName:  | pageURL: /p/PortalModule/ADMIN
[Client] [Widget] Menu: test1 | pageName:  | pageURL: /p/PortalModule/ADMIN
[Client] [Widget] Menu: Sub_Header3 | pageName: test2 | pageURL: 
[Client] [Widget] Menu: pages | pageName: PortalModule.Pages_Overview | pageURL:
```

**문제점:**
- URL 경로 직접 사용 (`/p/Module/Page`)
- 모듈.페이지명 형식 혼용 (`Module.PageName`)
- 일관성 없는 데이터 구조
- 두 가지 방식(pageURL, pageName)이 혼재

---

## 2. 주요 차이점 분석

### 페이지 참조 방식

| 구분 | Mendix Navigation | Custom Widget (현재) |
|------|-------------------|---------------------|
| 형식 | `Module/Page.page.xml` | `/p/Module/Page` 또는 `Module.Page` |
| 기반 | Mendix 메타데이터 | 하드코딩된 경로/이름 |
| 리팩토링 | ✅ 자동 업데이트 | ❌ 수동 수정 필요 |
| Studio Pro 지원 | ✅ 완전 지원 | ❌ 미지원 |

### 데이터 일관성 문제

```javascript
// Custom Widget의 혼재된 데이터 구조
Menu: MASTERPAEG  | pageName: ""  | pageURL: "/p/PortalModule/MASTER"  // URL만 사용
Menu: adminPage   | pageName: ""  | pageURL: "/p/PortalModule/ADMIN"   // URL만 사용
Menu: Sub_Header3 | pageName: "test2" | pageURL: ""                     // pageName만 사용
Menu: pages       | pageName: "PortalModule.Pages_Overview" | pageURL: "" // pageName만 사용
```

**문제:**
- 같은 속성에 두 가지 다른 방식 사용
- 처리 로직이 복잡해짐
- 예측 불가능한 동작

### 실행 메커니즘

**Mendix Navigation:**
```typescript
// Mendix 내부 API 사용
mx.ui.openForm(pageId, {
    location: "content",
    context: context,
    callback: function() { ... }
});
```

**Custom Widget (잘못된 방식):**
```typescript
// URL 직접 조작 또는 수동 페이지 호출
if (pageURL) {
    window.location.href = pageURL; // ❌ 잘못된 방식
} else if (pageName) {
    // pageName으로 페이지 찾기 시도
}
```

---

## 3. 해결 방법: ActionValue 사용

### Step 1: Widget XML 수정

**기존 (잘못된 방식):**
```xml
<property key="menuItems" type="object" isList="true">
    <property key="caption" type="textTemplate"/>
    <property key="pageURL" type="string"/>  <!-- ❌ 제거 -->
    <property key="pageName" type="string"/> <!-- ❌ 제거 -->
</property>
```

**수정 후 (올바른 방식):**
```xml
<property key="menuItems" type="object" isList="true">
    <caption>Menu Items</caption>
    <description>List of menu items</description>
    <properties>
        <property key="caption" type="textTemplate" required="true">
            <caption>Caption</caption>
            <description>Menu item display text</description>
        </property>
        
        <property key="icon" type="icon" required="false">
            <caption>Icon</caption>
            <description>Menu item icon</description>
        </property>
        
        <property key="action" type="action" required="false">
            <caption>On click</caption>
            <description>Action to execute when menu item is clicked</description>
        </property>
    </properties>
</property>
```

### Step 2: TypeScript Interface 수정

**기존:**
```typescript
interface MenuItem {
    caption: string;
    pageURL?: string;    // ❌ 제거
    pageName?: string;   // ❌ 제거
}
```

**수정 후:**
```typescript
import { ActionValue } from "mendix";

interface MenuItem {
    caption: string;
    icon?: DynamicValue<WebIcon>;
    action?: ActionValue;  // ✅ ActionValue 사용
}

export interface MyNavigationContainerProps {
    menuItems: MenuItem[];
}
```

### Step 3: 컴포넌트 구현

```typescript
import { Component, ReactNode, createElement } from "react";
import { ActionValue, WebIcon } from "mendix";

export class MyNavigation extends Component<MyNavigationContainerProps> {
    
    private handleMenuClick = (item: MenuItem): void => {
        console.log(`[Custom Widget] Executing action for: ${item.caption}`);
        
        // Action이 설정되어 있고 실행 가능한지 확인
        if (item.action && item.action.canExecute) {
            // ✅ Mendix가 알아서 올바르게 처리
            item.action.execute();
        }
    };

    private renderMenuItem = (item: MenuItem, index: number): ReactNode => {
        const isClickable = item.action && item.action.canExecute;
        
        return (
            <div
                key={index}
                className={`menu-item ${isClickable ? "clickable" : "disabled"}`}
                onClick={() => this.handleMenuClick(item)}
                role="button"
                tabIndex={isClickable ? 0 : -1}
            >
                {item.icon?.value && (
                    <span className="menu-icon">
                        {item.icon.value.type === "glyph" && (
                            <span className={`glyphicon ${item.icon.value.iconClass}`} />
                        )}
                    </span>
                )}
                <span className="menu-caption">{item.caption}</span>
            </div>
        );
    };

    render(): ReactNode {
        const { menuItems } = this.props;
        
        return (
            <nav className="custom-navigation">
                {menuItems.map((item, index) => this.renderMenuItem(item, index))}
            </nav>
        );
    }
}
```

---

## 4. 올바른 로그 출력 비교

### 수정 전 (Custom Widget)
```javascript
[Client] [Widget] Menu: MASTERPAEG | pageName:  | pageURL: /p/PortalModule/MASTER
[Client] [Widget] Menu: Sub_Header3 | pageName: test2 | pageURL: 
```

### 수정 후 (Custom Widget with ActionValue)
```javascript
[Navigation] Open a page with id: PortalModule/MASTER.page.xml
[Navigation] Open a page with id: PortalModule/test2.page.xml
```

**결과:**
- ✅ Mendix Navigation과 동일한 방식으로 작동
- ✅ 일관된 페이지 참조 시스템 사용
- ✅ Studio Pro 리팩토링 완전 지원

---

## 5. ActionValue의 장점

### 1. 타입 안정성
```typescript
// 컴파일 타임에 체크
if (action && action.canExecute) {
    action.execute();  // ✅ 안전
}
```

### 2. 다양한 액션 타입 지원
Studio Pro에서 자동으로 선택 가능:
- ✅ Show a page
- ✅ Call a microflow
- ✅ Call a nanoflow
- ✅ Open link
- ✅ Do nothing

### 3. 자동 컨텍스트 관리
```typescript
// Mendix가 자동으로 처리:
// - 현재 객체 컨텍스트
// - 페이지 히스토리
// - 네비게이션 스택
// - 권한 체크
action.execute();
```

### 4. 리팩토링 지원
- 페이지 이름 변경 → 자동 업데이트
- 모듈 이동 → 자동 업데이트
- 페이지 삭제 → 컴파일 에러 (조기 발견)

---

## 6. 마이그레이션 체크리스트

### XML 파일
- [ ] `pageURL` 속성 제거
- [ ] `pageName` 속성 제거
- [ ] `action` 속성 추가 (`type="action"`)

### TypeScript 파일
- [ ] `ActionValue` import 추가
- [ ] Interface에서 `pageURL`, `pageName` 제거
- [ ] Interface에 `action?: ActionValue` 추가
- [ ] URL 조작 코드 제거
- [ ] `action.execute()` 방식으로 변경

### 테스트
- [ ] 페이지 열기 동작 확인
- [ ] Microflow 호출 동작 확인
- [ ] 권한 체크 동작 확인
- [ ] 브라우저 콘솔에서 로그 확인

---

## 7. 추가 기능: 페이지 닫기 옵션

Mendix Navigation처럼 페이지 닫기 옵션도 추가할 수 있습니다:

### XML 설정
```xml
<property key="closePages" type="enumeration" defaultValue="none">
    <caption>Close pages</caption>
    <enumerationValues>
        <enumerationValue key="none">None</enumerationValue>
        <enumerationValue key="single">Single</enumerationValue>
        <enumerationValue key="multiple">Multiple</enumerationValue>
        <enumerationValue key="all">All</enumerationValue>
        <enumerationValue key="clearHistory">Clear history</enumerationValue>
    </enumerationValues>
</property>
```

### TypeScript 구현
```typescript
interface MenuItem {
    caption: string;
    icon?: DynamicValue<WebIcon>;
    action?: ActionValue;
    closePages?: "none" | "single" | "multiple" | "all" | "clearHistory";
}

private handleMenuClick = (item: MenuItem): void => {
    // 페이지 닫기 처리
    if (item.closePages && item.closePages !== "none") {
        this.handleClosePages(item.closePages);
    }
    
    // 액션 실행
    if (item.action?.canExecute) {
        item.action.execute();
    }
};

private handleClosePages(closeOption: string): void {
    // Mendix API를 사용한 페이지 닫기 처리
    switch (closeOption) {
        case "single":
            // 현재 페이지 닫기
            break;
        case "multiple":
            // 여러 페이지 닫기
            break;
        case "all":
            // 모든 페이지 닫기
            break;
        case "clearHistory":
            // 히스토리 초기화
            break;
    }
}
```

---

## 8. 결론

### ❌ 하지 말아야 할 것
- URL 직접 조작 (`window.location.href`)
- 하드코딩된 페이지 경로 (`/p/Module/Page`)
- 페이지 이름 문자열 사용 (`Module.PageName`)
- 두 가지 방식 혼용 (`pageURL`과 `pageName`)

### ✅ 해야 할 것
- **ActionValue 타입 사용**
- Mendix 메타데이터 시스템 활용
- `action.canExecute` 체크
- `action.execute()` 호출
- 일관된 데이터 구조 유지

### 핵심 원칙
> **"Mendix에게 위임하라"**  
> Custom Widget은 UI만 담당하고, 페이지 네비게이션은 Mendix의 ActionValue에게 맡기는 것이 가장 안전하고 유지보수가 쉬운 방법입니다.

---

## 참고 자료

- [Mendix Pluggable Widgets API](https://docs.mendix.com/apidocs-mxsdk/apidocs/pluggable-widgets/)
- [ActionValue Documentation](https://docs.mendix.com/apidocs-mxsdk/apidocs/pluggable-widgets-property-types/#action)
- [Best Practices for Custom Widgets](https://docs.mendix.com/howto/extensibility/create-a-pluggable-widget-one/)

---

**작성일:** 2025-12-29  
**작성자:** CBG  
**버전:** 1.0
