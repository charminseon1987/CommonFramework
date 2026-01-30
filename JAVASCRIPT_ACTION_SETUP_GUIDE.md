# JavaScript Action 설정 가이드

## 개요

이 가이드는 Mendix Studio Pro에서 JavaScript Action을 생성하고 설정하는 방법을 단계별로 설명합니다. 북마크 JSON을 localStorage에서 읽어오는 `GetBookmarkJsonFromLocalStorage` Action을 예시로 사용합니다.

## 1. JavaScript Action 생성

### Step 1: 새 JavaScript Action 추가

1. **Mendix Studio Pro**를 엽니다.
2. **App Explorer** 패널에서 프로젝트 루트를 선택합니다.
3. **Add** 버튼을 클릭합니다.
4. 드롭다운 메뉴에서 **JavaScript Action**을 선택합니다.

   ```
   App Explorer
   └─ 프로젝트 루트
      └─ Add → JavaScript Action
   ```

### Step 2: JavaScript Action 이름 설정

1. 새로 생성된 JavaScript Action을 선택합니다.
2. **Properties** 패널에서 **Name** 필드를 찾습니다.
3. 이름을 입력합니다: `GetBookmarkJsonFromLocalStorage`

   **주의사항**:
   - 이름은 영문자, 숫자, 언더스코어만 사용 가능합니다.
   - 공백은 사용할 수 없습니다.
   - 대소문자를 구분합니다.

### Step 3: Return Type 설정

1. **Properties** 패널에서 **Return Type** 섹션을 찾습니다.
2. **Type** 드롭다운을 클릭합니다.
3. **String**을 선택합니다.
4. **Required** 체크박스는 **해제**합니다 (값이 없을 수 있으므로).

   ```
   Return Type
   ├─ Type: String
   └─ Required: ☐ (체크 해제)
   ```

## 2. JavaScript 코드 작성

### Step 1: 코드 에디터 열기

1. JavaScript Action을 선택한 상태에서 **Code** 탭을 클릭합니다.
2. 코드 에디터가 열립니다.

### Step 2: 코드 작성

다음 코드를 에디터에 입력합니다:

```javascript
export async function GetBookmarkJsonFromLocalStorage() {
    // 브라우저 환경 확인
    if (typeof window !== "undefined" && window.localStorage) {
        try {
            const jsonString = window.localStorage.getItem("bangarlab-bookmark-json");
            return jsonString || "";
        } catch (error) {
            console.error("[GetBookmarkJsonFromLocalStorage] Error:", error);
            return "";
        }
        }
    return "";
}
```

### Step 3: 코드 설명

- **`export async function`**: Mendix에서 호출 가능한 비동기 함수로 내보냅니다.
- **`typeof window !== "undefined"`**: 브라우저 환경인지 확인합니다.
- **`window.localStorage`**: localStorage API 사용 가능 여부를 확인합니다.
- **`localStorage.getItem("bangarlab-bookmark-json")`**: 저장된 JSON 문자열을 읽어옵니다.
- **`|| ""`**: 값이 null이면 빈 문자열을 반환합니다.
- **`try-catch`**: 에러 발생 시 빈 문자열을 반환합니다.

### Step 4: 코드 저장

1. 코드 작성 후 **Ctrl+S** (또는 **Cmd+S**)로 저장합니다.
2. 또는 **File** → **Save** 메뉴를 사용합니다.

## 3. JavaScript Action 테스트

### Step 1: 테스트 Microflow 생성

1. **File** → **New** → **Microflow**를 선택합니다.
2. Microflow 이름: `TEST_GetBookmarkJson`
3. **Parameters** 탭: 파라미터 불필요

### Step 2: JavaScript Action 호출

1. **Toolbox** 패널에서 **JavaScript Action** 액티비티를 찾습니다.
2. 캔버스에 드래그하여 추가합니다.
3. 액티비티를 더블클릭하여 설정을 엽니다.

### Step 3: JavaScript Action 설정

1. **JavaScript Action** 드롭다운에서 `GetBookmarkJsonFromLocalStorage`를 선택합니다.
2. **Return Value** 섹션에서:
   - **Variable name**: `$BookmarkJson` 입력
   - **Variable type**: `String` (자동 설정됨)

   ```
   JavaScript Action: GetBookmarkJsonFromLocalStorage
   └─ Return Value
      ├─ Variable name: $BookmarkJson
      └─ Variable type: String
   ```

### Step 4: 결과 확인

1. **Show Message** 액티비티를 추가합니다.
2. **Message** 필드에 `$BookmarkJson`을 입력합니다.
3. Microflow를 실행하여 결과를 확인합니다.

## 4. Microflow에서 사용하기

### Step 1: Microflow에 JavaScript Action 추가

1. `ACT_BookmarkReorganize` Microflow를 엽니다.
2. **Toolbox**에서 **JavaScript Action** 액티비티를 추가합니다.
3. 설정:
   - **JavaScript Action**: `GetBookmarkJsonFromLocalStorage`
   - **Return Value**: `$BookmarkJson` (String)

### Step 2: 빈 값 체크

1. **If** 액티비티를 추가합니다.
2. **Condition** 설정:
   ```
   $BookmarkJson = empty
   ```
3. **True** 경로: 메시지 표시 후 종료
4. **False** 경로: 다음 단계 진행

### Step 3: 완성된 Microflow 구조

```
[Start]
  → [JavaScript Action: GetBookmarkJsonFromLocalStorage]
    Return: $BookmarkJson (String)
  → [If: $BookmarkJson = empty]
    → [Show Message: "저장할 북마크 데이터가 없습니다."]
    → [End]
  → [Retrieve: ExistingBookmarks]
    Entity: SyMenu_Bookmarked
    XPath: [SyMenu_Bookmarked_SyUser = $CurrentUser]
  → [Delete Object: ExistingBookmarks]
  → [Call Microflow: SUB_ParseBookmarkJson]
    Parameter: $BookmarkJson
    Return: $ParsedItems (List)
  → [Loop: $ParsedItems]
    → ... (북마크 생성 로직)
  → [Commit]
  → [End]
```

## 5. 주의사항

### 5.1 브라우저 환경

- JavaScript Action은 **브라우저 환경에서만** 동작합니다.
- 서버 사이드 Microflow에서는 사용할 수 없습니다.
- 클라이언트 사이드 (Nanoflow 또는 클라이언트 사이드 Microflow)에서만 사용 가능합니다.

### 5.2 localStorage 접근

- localStorage는 **사용자별로 격리**되어 저장됩니다.
- 같은 브라우저의 다른 탭에서도 동일한 값을 읽을 수 있습니다.
- 브라우저를 닫아도 값이 유지됩니다 (세션 스토리지와 다름).

### 5.3 에러 처리

- localStorage 접근이 실패할 수 있는 경우:
  - 브라우저가 localStorage를 지원하지 않는 경우
  - 사용자가 localStorage를 비활성화한 경우
  - 저장 용량 초과
- 코드에서 `try-catch`로 에러를 처리하고 빈 문자열을 반환합니다.

### 5.4 보안 고려사항

- localStorage는 클라이언트 사이드에 저장되므로 **민감한 정보는 저장하지 마세요**.
- XSS 공격에 취약할 수 있으므로 저장된 데이터를 사용할 때 검증이 필요합니다.

## 6. 문제 해결

### 문제: JavaScript Action이 보이지 않음

**해결**:
1. JavaScript Action이 올바르게 생성되었는지 확인
2. **App Explorer**에서 JavaScript Action 위치 확인
3. Microflow의 **Toolbox**에서 **JavaScript Action** 액티비티가 있는지 확인

### 문제: "window is not defined" 에러

**해결**:
- JavaScript Action은 브라우저 환경에서만 동작합니다.
- 서버 사이드 Microflow에서 호출하지 마세요.
- Nanoflow 또는 클라이언트 사이드 Microflow에서만 사용하세요.

### 문제: localStorage에서 값을 읽지 못함

**해결**:
1. 브라우저 개발자 도구에서 localStorage 확인:
   ```javascript
   localStorage.getItem("bangarlab-bookmark-json")
   ```
2. 저장 키가 정확한지 확인: `"bangarlab-bookmark-json"`
3. 위젯에서 localStorage에 저장이 완료되었는지 확인

### 문제: Return Value가 설정되지 않음

**해결**:
1. JavaScript Action의 **Return Type**이 올바르게 설정되었는지 확인
2. Microflow에서 **Return Value**의 **Variable name**이 올바른지 확인
3. 변수 이름은 `$`로 시작해야 합니다 (예: `$BookmarkJson`)

## 7. 추가 리소스

- [Mendix JavaScript Actions 가이드](https://docs.mendix.com/refguide/javascript-actions)
- [Mendix Client-Side API](https://docs.mendix.com/refguide/client-side-api)
- [MDN localStorage 문서](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)

---

**작성일**: 2025-01-XX  
**버전**: 1.0
