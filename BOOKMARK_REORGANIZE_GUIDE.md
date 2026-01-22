# 북마크 재구성 기능 구현 가이드

## 개요

이 가이드는 DynamicNavigation 위젯의 북마크 재구성 기능을 Mendix Microflow/Nanoflow에서 구현하는 방법을 설명합니다.

## 1. 위젯 설정

### 1.1 위젯 속성 설정

1. Mendix Studio Pro에서 DynamicNavigation 위젯을 선택합니다.
2. Properties 패널에서 **Behavior** 섹션을 찾습니다.
3. **On Bookmark Reorganize** Action을 설정합니다.
   - Microflow 또는 Nanoflow를 선택할 수 있습니다.
   - **권장: Microflow 사용** (복잡한 로직 처리에 적합)

## 2. Microflow 구현

### 2.1 Microflow 생성

1. **File** → **New** → **Microflow** 선택
2. Microflow 이름: `ACT_BookmarkReorganize` (또는 원하는 이름)
3. **Parameters** 탭: 파라미터 불필요 (localStorage에서 직접 읽어옴)

### 2.2 Microflow 로직 구현

#### Step 1: localStorage에서 JSON 읽기

1. **Toolbox**에서 **JavaScript Action** 액티비티를 추가합니다.
2. 설정:
   - **JavaScript Action**: `GetBookmarkJsonFromLocalStorage` (6.1 섹션 참고)
   - **Return Value**: `$BookmarkJson` (String 변수)
3. **If** 액티비티 추가:
   - Condition: `$BookmarkJson = empty`
   - True: 메시지 표시 후 종료
   - False: 다음 단계 진행

#### Step 2: JSON 파싱

1. **Toolbox**에서 **Call Microflow** 액티비티를 추가합니다.
2. JSON 파싱을 위한 별도 Microflow 호출:
   - Microflow: `SUB_ParseBookmarkJson`
   - Parameter: `$BookmarkJson` (Step 1에서 읽어온 값)

#### Step 2: 기존 북마크 데이터 삭제

1. **Toolbox**에서 **Retrieve** 액티비티를 추가합니다.
2. 설정:
   - **Entity**: `SyMenu_Bookmarked`
   - **XPath Constraint**: `[SyMenu_Bookmarked_SyUser = $CurrentUser]`
   - **Variable**: `ExistingBookmarks`
   - **Retrieve**: `By association` → `SyMenu_Bookmarked_SyUser` → `$CurrentUser`
3. **Toolbox**에서 **Delete Object** 액티비티를 추가합니다.
4. 설정:
   - **Object to delete**: `$ExistingBookmarks` (리스트)
   - **Delete behavior**: `Delete automatically`

#### Step 3: 새 북마크 구조 생성

**중요**: LeftNo와 RightNo는 위젯에서 이미 계산되어 JSON에 포함되어 있습니다. Mendix에서는 단순히 저장만 하면 됩니다.

1. **Loop** 액티비티를 사용하여 파싱된 북마크 항목들을 순회합니다.
2. 각 항목에 대해:
   - **Create Object** 액티비티로 `SyMenu_Bookmarked` 엔티티 생성
   - 속성 설정:
     - `MenuId` (Integer): 파싱된 `menuId`를 Integer로 변환
     - `MenuName` (String): 파싱된 `menuName`
     - `Description` (String): 파싱된 `description` (있는 경우) 또는 빈 문자열
     - `ParentId` (Integer): 파싱된 `parentId` (null이면 빈 값 또는 0)
     - `Depth` (Integer): 파싱된 `depth`
     - `SortNo` (Integer): 파싱된 `sortNo`
     - `LeftNo` (Integer): **파싱된 `leftNo`** (위젯에서 계산됨)
     - `RightNo` (Integer): **파싱된 `rightNo`** (위젯에서 계산됨)
     - `DisplayYn` (String): `"Y"` (기본값)
     - `EnableTF` (Boolean): `true` (기본값)
     - `IsBookmarked` (Boolean): `true`
   - **Create Association** 액티비티로 사용자와 연결:
     - Association: `SyMenu_Bookmarked_SyUser`
     - Object: `$CurrentUser`
   - **Create Association** 액티비티로 부모와 연결 (ParentId가 있는 경우):
     - Association: `SyMenu_Bookmarked_SyMenu_Bookmarked` (자기 참조)
     - Parent Object: 부모 `SyMenu_Bookmarked` 객체

### 2.3 완성된 Microflow 예시 구조

**단순화된 구조**: LeftNo, RightNo는 위젯에서 계산되어 JSON에 포함되므로 별도 계산 Microflow가 필요 없습니다.

```
[Start] 
  → [Parameter: BookmarkJson (String)]
  → [Retrieve: CurrentUser]
  → [Retrieve: ExistingBookmarks]
    Entity: SyMenu_Bookmarked
    XPath: [SyMenu_Bookmarked_SyUser = $CurrentUser]
  → [Delete Object: ExistingBookmarks]
  → [Call Microflow: SUB_ParseBookmarkJson]
    Parameter: $BookmarkJson
    Return: $ParsedItems (List)
  → [Loop: $ParsedItems]
    → [Create Object: SyMenu_Bookmarked]
    → [Set Attribute: MenuId = $ParsedItem/menuId]
    → [Set Attribute: MenuName = $ParsedItem/menuName]
    → [Set Attribute: Description = $ParsedItem/description]
    → [Set Attribute: ParentId = $ParsedItem/parentId]
    → [Set Attribute: Depth = $ParsedItem/depth]
    → [Set Attribute: SortNo = $ParsedItem/sortNo]
    → [Set Attribute: LeftNo = $ParsedItem/leftNo]  ← 위젯에서 계산됨
    → [Set Attribute: RightNo = $ParsedItem/rightNo] ← 위젯에서 계산됨
    → [Set Attribute: DisplayYn = "Y"]
    → [Set Attribute: EnableTF = true]
    → [Set Attribute: IsBookmarked = true]
    → [Create Association: SyMenu_Bookmarked_SyUser]
      Object: $CurrentUser
    → [If: ParentId != null]
      → [Retrieve: ParentBookmark]
        Entity: SyMenu_Bookmarked
        XPath: [MenuId = $ParsedItem/parentId and SyMenu_Bookmarked_SyUser = $CurrentUser]
      → [Create Association: SyMenu_Bookmarked_SyMenu_Bookmarked]
        Object: $ParentBookmark
  → [Commit]
  → [End]
```

## 3. JSON 파싱 Microflow (SUB_ParseBookmarkJson)

### 3.1 JSON 구조

위젯에서 전달되는 JSON 구조:

```json
{
  "items": [
    {
      "menuId": "menu-1",
      "menuName": "메뉴 1",
      "parentId": null,
      "depth": 0,
      "sortNo": 0,
      "leftNo": 1,
      "rightNo": 2,
      "isFolder": false,
      "originalMenuId": "menu-1"
    },
    {
      "menuId": "folder-1",
      "menuName": "내 폴더",
      "parentId": null,
      "depth": 0,
      "sortNo": 1,
      "leftNo": 3,
      "rightNo": 6,
      "isFolder": true
    },
    {
      "menuId": "menu-2",
      "menuName": "메뉴 2",
      "parentId": "folder-1",
      "depth": 1,
      "sortNo": 0,
      "leftNo": 4,
      "rightNo": 5,
      "isFolder": false,
      "originalMenuId": "menu-2"
    }
  ]
}
```

**참고**: 
- `leftNo`와 `rightNo`는 위젯에서 Nested Set Model 알고리즘으로 자동 계산되어 포함됩니다.
- `isFolder`: `pageURL`이 없고 `children`이 있을 때만 `true`입니다.
- `pageURL`이 있는 항목은 폴더가 될 수 없으며, 하위 children도 가질 수 없습니다.

### 3.2 JSON 파싱 방법

#### 방법 1: Community Commons 사용 (권장)

1. **Marketplace**에서 **Community Commons** 모듈 설치
2. **Call Microflow** 액티비티 추가:
   - Microflow: `CommunityCommons.JsonToObject`
   - Parameter: `$BookmarkJson`
   - Return: `ParsedJson` (Object 엔티티)

#### 방법 2: 커스텀 JSON 파싱

1. **Create Object** 액티비티로 임시 엔티티 생성
2. **Set Attribute** 액티비티로 JSON 문자열 저장
3. **Java Action** 또는 **JavaScript Action**으로 파싱
4. 파싱된 데이터를 리스트로 반환

### 3.3 JSON 파싱 Microflow 예시

```
[Start]
  → [Create Object: TempJsonObject]
  → [Set Attribute: JsonString = $BookmarkJson]
  → [Call Java Action: ParseJsonString]
  → [Return: ParsedItems]
  → [End]
```

## 4. LeftNo, RightNo 계산 (위젯에서 처리)

### 4.1 위젯에서 자동 계산

**중요**: LeftNo와 RightNo는 위젯에서 자동으로 계산되어 JSON에 포함됩니다. Mendix Microflow에서는 별도의 계산 로직이 필요 없습니다.

**계산 원리 (위젯 내부):**
- 각 노드를 방문할 때마다 카운터를 증가시킵니다
- 노드에 처음 들어갈 때 LeftNo를 설정합니다
- 모든 자식 노드를 처리한 후 RightNo를 설정합니다
- 계산된 값이 JSON에 포함되어 전달됩니다

**예시:**
```
트리 구조:
- 메뉴 1 (leftNo: 1, rightNo: 2)
- 내 폴더 (leftNo: 3, rightNo: 6)
  └─ 메뉴 2 (leftNo: 4, rightNo: 5)
```

### 4.2 Mendix에서의 처리

Mendix Microflow에서는 위젯에서 전달된 `leftNo`와 `rightNo` 값을 그대로 사용하면 됩니다:

```
[Set Attribute: LeftNo]
  Value: $ParsedItem/leftNo

[Set Attribute: RightNo]
  Value: $ParsedItem/rightNo
```

**장점:**
- Mendix Microflow가 단순해짐 (계산 로직 불필요)
- 성능 향상 (서버 사이드 계산 제거)
- 유지보수 용이 (로직이 위젯에 집중)

## 5. Nanoflow 구현 (간단한 경우)

Nanoflow는 클라이언트 사이드에서 실행되므로, 간단한 경우에만 사용하는 것을 권장합니다.

### 5.1 Nanoflow 생성

1. **File** → **New** → **Nanoflow** 선택
2. Nanoflow 이름: `NF_BookmarkReorganize`
3. **Parameters** 탭에서 파라미터 추가:
   - **Name**: `BookmarkJson`
   - **Type**: `String`

### 5.2 Nanoflow 로직

1. **Call Microflow** 액티비티 추가
2. 서버 사이드 Microflow 호출:
   - Microflow: `ACT_BookmarkReorganize`
   - Parameter: `$BookmarkJson`

**주의**: Nanoflow에서는 직접 데이터베이스 작업을 할 수 없으므로, 실제 로직은 Microflow에서 처리해야 합니다.

## 6. 위젯에서 JSON 전달 방법

위젯 코드에서 JSON을 전달하는 방법:

```typescript
// useBookmarkEdit.ts에서
const handleSave = () => {
    const structure = buildBookmarkStructure(editedTree);
    const jsonString = bookmarkStructureToJson(structure);
    
    // localStorage에 저장
    try {
        if (typeof window !== "undefined" && window.localStorage) {
            localStorage.setItem("bangarlab-bookmark-json", jsonString);
            console.log("[BookmarkEdit] JSON saved to localStorage");
        }
    } catch (error) {
        console.warn("[BookmarkEdit] Failed to save to localStorage:", error);
    }
    
    // Mendix Action 호출
    if (onSave && onSave.canExecute) {
        onSave.execute();
    }
};
```

**중요**: Mendix Action은 기본적으로 JSON 문자열을 직접 파라미터로 받을 수 없습니다. 따라서 위젯에서 JSON을 localStorage에 저장하고, Microflow/Nanoflow에서 JavaScript Action을 통해 읽어옵니다.

### 방법: localStorage + JavaScript Action 사용 (권장)

1. 위젯에서 JSON을 localStorage에 저장 (자동 처리됨)
2. Microflow/Nanoflow에서 JavaScript Action으로 localStorage에서 읽기
3. 읽어온 JSON 문자열을 파싱하여 처리

## 6.1 JavaScript Action 생성

**상세 가이드**: JavaScript Action 설정 방법에 대한 자세한 내용은 [JAVASCRIPT_ACTION_SETUP_GUIDE.md](JAVASCRIPT_ACTION_SETUP_GUIDE.md)를 참고하세요.

### Step 1: JavaScript Action 생성

1. Mendix Studio Pro에서 **App Explorer** → **Add** → **JavaScript Action** 선택
2. Action 이름: `GetBookmarkJsonFromLocalStorage`
3. **Return Type** 설정:
   - Type: `String`
   - Required: `No` (값이 없을 수 있음)

### Step 2: JavaScript 코드 작성

JavaScript Action의 코드 에디터에 다음 코드를 작성:

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

### Step 3: Microflow에서 JavaScript Action 사용

`ACT_BookmarkReorganize` Microflow를 다음과 같이 수정:

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
    → [Create Object: SyMenu_Bookmarked]
    → ... (기존 로직 계속)
  → [Commit]
  → [End]
```

**주의사항**:
- Microflow 파라미터는 더 이상 필요하지 않습니다 (JavaScript Action에서 직접 읽어옴)
- JavaScript Action은 브라우저 환경에서만 동작합니다 (클라이언트 사이드)
- localStorage는 사용자별로 격리되어 저장됩니다
- **`Refresh in Client` 액티비티를 추가하여 bookmark 데이터 소스를 새로고침해야 위젯에 변경사항이 반영됩니다**
- 저장 성공 시 위젯에서 편집 모드가 자동으로 닫힙니다

## 7. 저장 후 동작

### 7.1 위젯 자동 동작

저장 버튼 클릭 시 위젯에서 자동으로 수행되는 동작:

1. **편집 모드 자동 종료**: 저장 성공 시 편집 모드가 자동으로 닫힙니다.
2. **데이터 새로고침**: Microflow에서 `Refresh in Client` 액티비티를 사용하여 bookmark 데이터 소스를 새로고침해야 합니다.

### 7.2 Refresh in Client 설정

Microflow에서 `Commit` 액티비티 이후에 `Refresh in Client` 액티비티를 추가합니다:

1. **Toolbox**에서 **Refresh in Client** 액티비티를 추가합니다.
2. 설정:
   - **Object**: bookmark 데이터 소스 객체 (또는 `$CreatedBookmarks` 리스트)
   - **Refresh behavior**: `Refresh object` 또는 `Refresh list`
3. 이렇게 하면 위젯의 bookmark 데이터 소스가 자동으로 새로고침되어 저장된 북마크가 bookmark tab에 표시됩니다.

**참고**: 
- `Refresh in Client`는 클라이언트 사이드에서만 동작합니다.
- 데이터 소스가 List인 경우 `Refresh list`를 사용합니다.
- 특정 객체만 새로고침하려면 `Refresh object`를 사용합니다.

## 8. 테스트 방법

### 8.1 테스트 시나리오

1. **북마크 추가**: 메뉴를 북마크에 추가
2. **폴더 생성**: 새 폴더 생성
3. **드래그앤드롭**: 메뉴를 폴더로 이동
4. **저장**: 변경사항 저장
5. **확인**: 
   - 편집 모드가 자동으로 닫히는지 확인
   - bookmark tab에서 저장된 북마크가 표시되는지 확인
   - 데이터베이스에서 북마크 구조 확인

### 7.2 디버깅

1. **Microflow 디버깅**:
   - Microflow 실행 시 **Debug** 모드 활성화
   - 각 액티비티의 변수 값 확인
   - JSON 파싱 결과 확인

2. **위젯 디버깅**:
   - 브라우저 개발자 도구에서 콘솔 확인
   - JSON 문자열 출력 확인
   - Action 호출 확인

## 9. 주의사항

### 9.1 성능 고려사항

- 대량의 북마크가 있는 경우, 배치 처리 고려
- 트랜잭션 범위 최소화
- 인덱스 설정 확인 (`MenuId`, `ParentId`, `SyUser`)

### 8.2 데이터 무결성

- 순환 참조 방지
- 부모-자식 관계 유효성 검사
- 사용자별 북마크 격리 확인
- **pageURL이 있는 항목은 폴더가 될 수 없음** (위젯에서 자동 검증)
- **pageURL이 있는 항목은 하위 children을 가질 수 없음** (위젯에서 자동 검증)

### 9.3 트랜잭션 처리

**중요**: 트랜잭션은 **Mendix Microflow에서 자동으로 처리**됩니다.

#### 위젯의 역할
- 변경사항을 메모리 상태(React state)로만 관리
- "저장" 버튼 클릭 시 JSON으로 변환하여 Mendix Action 호출
- 트랜잭션 처리 없음 (클라이언트 사이드)

#### Mendix Microflow의 역할
- Microflow 실행 시 자동으로 트랜잭션 시작
- 모든 데이터베이스 작업(삭제, 생성)이 하나의 트랜잭션으로 처리
- `Commit` 액티비티에서 트랜잭션 커밋
- 에러 발생 시 자동 롤백 (모든 변경사항 취소)

#### 트랜잭션 흐름 예시

**성공 시:**
```
[Microflow 시작]
  → 트랜잭션 시작 (자동)
  → 기존 북마크 삭제
  → 새 북마크 생성 (10개)
  → Commit ✅
  → 트랜잭션 커밋 완료
  → 모든 변경사항 저장됨
```

**실패 시:**
```
[Microflow 시작]
  → 트랜잭션 시작 (자동)
  → 기존 북마크 삭제 ✅
  → 새 북마크 생성 중... (5개 생성 후 에러 발생)
  → 에러 발생 ❌
  → 자동 롤백
  → 기존 북마크 삭제도 취소됨 (원상복구)
  → 데이터베이스 변경 없음
```

**주의사항:**
- Microflow 내에서 `Commit`을 여러 번 호출하지 마세요 (트랜잭션 분리됨)
- 모든 작업을 완료한 후 마지막에 한 번만 `Commit` 호출
- 에러 처리 로직 추가 권장 (`Error Handler` 액티비티 사용)

### 8.3 에러 처리

- JSON 파싱 실패 시 에러 처리
- 데이터베이스 저장 실패 시 롤백
- 사용자에게 적절한 에러 메시지 표시

## 9. 완성된 예시 Microflow

### 10.1 엔티티 구조 확인

**SyMenu_Bookmarked 엔티티 속성:**
- `MenuId` (Integer): 메뉴 고유 ID
- `MenuName` (String): 메뉴 이름
- `Description` (String): 설명
- `ParentId` (Integer): 부모 메뉴 ID (null 가능)
- `Depth` (Integer): 깊이 레벨 (0부터 시작)
- `SortNo` (Integer): 정렬 순서
- `LeftNo` (Integer): Nested Set Model 좌측 번호
- `RightNo` (Integer): Nested Set Model 우측 번호
- `DisplayYn` (String): 표시 여부 ("Y" 또는 "N")
- `EnableTF` (Boolean): 활성화 여부
- `IsBookmarked` (Boolean): 북마크 여부

**관계 (Associations):**
- `SyMenu_Bookmarked_SyUser` (Many-to-One): 사용자와의 관계
- `SyMenu_Bookmarked_SyMenu_Bookmarked` (1-to-Many, 자기 참조): 부모-자식 관계

### 9.2 Microflow 상세 구조

**중요**: 이 구조는 실제 Mendix Studio Pro에서 구현 가능하도록 수정되었습니다.

```
[Start]
  → [Parameter: BookmarkJson (String)]
  → [Retrieve: ExistingBookmarks]
    Entity: SyMenu_Bookmarked
    Retrieve: By association
    Association: SyMenu_Bookmarked_SyUser
    Object: $CurrentUser (또는 별도 조회)
    Variable: $ExistingBookmarks
  → [Delete Object: ExistingBookmarks]
    Delete behavior: Delete automatically
  → [Call Microflow: SUB_ParseBookmarkJson]
    Parameter: $BookmarkJson
    Return: $ParsedItems (List of ParsedBookmarkItem)
  → [If: $ParsedItems = empty]
    → [Show Message: "저장할 북마크가 없습니다."]
    → [End]
  → [Create Variable: CreatedBookmarks]
    Type: List of SyMenu_Bookmarked
    Value: empty list
    Variable: $CreatedBookmarks
  → [Loop: $ParsedItems]
    → [Create Object: SyMenu_Bookmarked]
      Variable: $NewBookmark
    → [Set Attribute: MenuId]
      Attribute: MenuId
      Value: toInteger($ParsedItem/MenuId)
    → [Set Attribute: MenuName]
      Attribute: MenuName
      Value: $ParsedItem/MenuName
    → [Set Attribute: Description]
      Attribute: Description
      Value: if($ParsedItem/Description = empty, "", $ParsedItem/Description)
    → [Set Attribute: ParentId]
      Attribute: ParentId
      Value: if($ParsedItem/ParentId = empty, empty, toInteger($ParsedItem/ParentId))
    → [Set Attribute: Depth]
      Attribute: Depth
      Value: $ParsedItem/Depth
    → [Set Attribute: SortNo]
      Attribute: SortNo
      Value: $ParsedItem/SortNo
    → [Set Attribute: LeftNo]
      Attribute: LeftNo
      Value: $ParsedItem/LeftNo
    → [Set Attribute: RightNo]
      Attribute: RightNo
      Value: $ParsedItem/RightNo
    → [Set Attribute: DisplayYn]
      Attribute: DisplayYn
      Value: "Y"
    → [Set Attribute: EnableTF]
      Attribute: EnableTF
      Value: true
    → [Set Attribute: IsBookmarked]
      Attribute: IsBookmarked
      Value: true
    → [Change Object: SyMenu_Bookmarked_SyUser]
      Object: $NewBookmark
      Change: Change association
      Association: SyMenu_Bookmarked_SyUser
      Target: $CurrentUser
    → [List Operation: Add to List]
      List: $CreatedBookmarks
      Object: $NewBookmark
    → [If: $ParsedItem/ParentId != empty]
      → [List Operation: Find]
        List: $CreatedBookmarks
        XPath: [MenuId = toInteger($ParsedItem/ParentId)]
        Variable: $ParentBookmark
      → [If: $ParentBookmark != empty]
        → [Change Object: SyMenu_Bookmarked_SyMenu_Bookmarked]
          Object: $NewBookmark
          Change: Change association
          Association: SyMenu_Bookmarked_SyMenu_Bookmarked
          Target: $ParentBookmark
  → [Commit]
    Object to commit: $CreatedBookmarks
    Commit behavior: Yes
  → [Refresh in Client]
    Object: $CreatedBookmarks (또는 bookmark 데이터 소스)
    Refresh behavior: Refresh object
  → [Show Message: "북마크가 저장되었습니다."]
  → [End]

[Error Handler]
  → [Show Message: "북마크 저장 중 오류가 발생했습니다: " + $Error]
  → [Log: Error]
```

**중요**: `Refresh in Client` 액티비티를 추가하여 bookmark 데이터 소스를 새로고침해야 합니다. 이렇게 하면 위젯에서 저장된 북마크 데이터를 자동으로 다시 로드합니다.

**주요 변경사항:**

1. **부모 조회 방법 변경**: 
   - ❌ 데이터베이스에서 부모 조회 (Commit 전에는 불가능)
   - ✅ Loop 내에서 생성한 북마크를 리스트(`$CreatedBookmarks`)에 저장하고, 부모를 찾을 때 이 리스트에서 검색

2. **CurrentUser 처리**:
   - `$CurrentUser`는 이미 컨텍스트에 있을 수 있으므로 별도 조회 생략 가능
   - 필요시 `[Retrieve: CurrentUser]` 액티비티 추가

3. **JSON 파싱**:
   - `SUB_ParseBookmarkJson` Microflow는 Java Action 또는 Community Commons를 사용하여 구현 필요
   - 반환 타입: `List of ParsedBookmarkItem` (임시 엔티티)

4. **에러 처리**:
   - Error Handler 추가 권장
   - 트랜잭션 롤백 자동 처리

## 11. 추가 리소스

- [Mendix Microflow 가이드](https://docs.mendix.com/refguide/microflows)
- [Mendix JSON 처리](https://docs.mendix.com/refguide/json-structures)
- [Community Commons 모듈](https://marketplace.mendix.com/link/component/170)

## 문제 해결

### 문제: JSON 파라미터를 받을 수 없음

**해결**: Microflow 파라미터 타입을 `String`으로 설정하고, JSON 문자열을 파싱하는 로직 추가

### 문제: 북마크가 저장되지 않음

**해결**: 
1. Microflow 실행 로그 확인
2. 트랜잭션 커밋 확인
3. 사용자 연결 확인

### 문제: LeftNo, RightNo가 올바르게 저장되지 않음

**해결**: 
1. 위젯에서 생성된 JSON 확인 (브라우저 개발자 도구)
2. JSON에 `leftNo`, `rightNo` 필드가 포함되어 있는지 확인
3. Microflow에서 JSON 파싱 시 `leftNo`, `rightNo` 값을 올바르게 읽는지 확인
4. Set Attribute 액티비티에서 값 설정 확인

---

**작성일**: 2025-01-XX  
**버전**: 1.0
