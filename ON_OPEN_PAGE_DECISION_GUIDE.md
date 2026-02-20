# onOpenPage 마이크로플로우 - Decision(Switch) 패턴 가이드

## 1. Mendix Show Page 제한사항

[Mendix Show Page 공식 문서](https://docs.mendix.com/refguide/show-page/)에 따르면:

- **Page** 속성은 **App Explorer에서 페이지를 드래그하여 선택**하는 방식
- **디자인 타임**에 표시할 페이지를 지정
- **런타임 문자열 변수**로 페이지를 동적으로 선택하는 옵션은 **지원되지 않음**

따라서 `$pageURL` 같은 문자열 변수로 Show Page의 Page 속성을 지정할 수 없습니다.

## 2. Decision(조건 분기) 사용 근거

[Mendix Decision 문서](https://docs.mendix.com/refguide/decision/):

> "A decision is an element that **makes a choice based on a condition** and follows one and only one of the outgoing sequence flows."

- Decision의 Expression은 **Boolean** 또는 **Enumeration** 반환
- 문자열 비교: `$pageURL = 'PortalModule/userRegister'` → Boolean
- 여러 페이지를 구분하려면 **여러 Decision을 연속**으로 배치

Mendix에는 "Switch"라는 이름의 액티비티는 없고, **여러 Decision을 이어 붙여** Switch와 같은 패턴을 구현합니다.

## 3. 마이크로플로우 구조

### 3.1 파라미터

- 마이크로플로우에 **$pageURL** (String) 파라미터 추가
- 위젯의 `onOpenPage.execute({ pageURL: pagePath })` 호출 시 이 값이 전달됨

### 3.2 Decision 체인 구조

```
[Start] → [Decision: $pageURL = 'PortalModule/userRegister']
            ├─ true  → [Show Page: userRegister] → [End]
            └─ false → [Decision: $pageURL = 'PortalModule/userList']
                         ├─ true  → [Show Page: userList] → [End]
                         └─ false → [Decision: $pageURL = '...'] 또는 [End]
```

### 3.3 Studio Pro 설정 절차

1. **마이크로플로우 생성**
   - 파라미터: `pageURL` (String)

2. **첫 번째 Decision 추가**
   - Expression: `$pageURL = 'PortalModule/userRegister'` (또는 실제 페이지 경로)
   - true: Show Page (userRegister 페이지 선택)
   - false: 다음 Decision으로 연결

3. **두 번째 Decision 추가**
   - Expression: `$pageURL = 'PortalModule/userList'`
   - true: Show Page (userList 페이지 선택)
   - false: 다음 Decision 또는 End

4. **위젯 연결**
   - Dynamic Navigation 위젯의 **On Open Page** 속성
   - **Call microflow** 선택 → 위에서 만든 마이크로플로우 선택
   - `pageURL` 파라미터 Argument: action variable `pageURL` 선택 (Mendix 10.21+)

## 4. pageURL 형식

위젯은 `Resource.PageUrl` 값을 `Module/Page` 형식으로 정규화하여 전달합니다.

- 예: `PortalModule/userRegister`, `PortalModule/userList`
- `.page.xml` 접미사는 제거됨
- `/p/` 또는 `/` 접두사는 제거됨

## 5. 대안: Attribute 방식 (action variable 매핑 실패 시)

Mendix 10.21 이전 또는 action variable이 expression에 노출되지 않는 경우:

1. **비영속 엔티티** `PageContext` 생성 (String attribute: `PageUrlToOpen`)
2. **DataView**로 위젯 감싸기, DataView에서 PageContext 객체 생성
3. 위젯 **Page URL to Open** 속성 → `$pageContext/PageUrlToOpen`에 바인딩
4. 위젯이 `setValue(pagePath)` → `execute()` 순서로 호출 (action variable 없음)
5. 마이크로플로우 Argument: **$pageContext/PageUrlToOpen**

위젯은 `pageUrlToOpen`이 바인딩되면 자동으로 Attribute 방식을 사용합니다.
