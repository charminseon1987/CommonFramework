# Mendix Microflow 구현 단계별 가이드

## 개요

이 문서는 DynamicNavigation 위젯의 북마크 재구성 기능을 Mendix Studio Pro에서 실제로 구현하는 단계별 가이드를 제공합니다.

## 구현 전 준비사항

### 1. 엔티티 확인

`SyMenu_Bookmarked` 엔티티에 다음 속성이 있는지 확인:
- `MenuId` (Integer)
- `MenuName` (String)
- `Description` (String, Optional)
- `ParentId` (Integer, Optional)
- `Depth` (Integer)
- `SortNo` (Integer)
- `LeftNo` (Integer)
- `RightNo` (Integer)
- `DisplayYn` (String)
- `EnableTF` (Boolean)
- `IsBookmarked` (Boolean)

### 2. 관계 확인

- `SyMenu_Bookmarked_SyUser` (Many-to-One with SyUser)
- `SyMenu_Bookmarked_SyMenu_Bookmarked` (1-to-Many, 자기 참조)

---

## Step 1: 메인 Microflow 생성

### 1.1 Microflow 생성

1. **File** → **New** → **Microflow**
2. 이름: `ACT_BookmarkReorganize`
3. **Settings** 탭:
   - **Error handling**: `Custom with rollback` (권장)
   - **Show progress bar**: 선택 (선택사항)

### 1.2 파라미터 추가

**Parameters** 탭에서:
- **Name**: `BookmarkJson`
- **Type**: `String`
- **Required**: `Yes`
- **Description**: `JSON string containing bookmark structure`

---

## Step 2: JSON 파싱 구현

Mendix에서 JSON을 직접 파싱하는 방법은 제한적입니다. 다음 방법 중 하나를 선택하세요.

### 방법 1: Java Action 사용 (권장)

#### 2.1 Java Action 생성

1. **File** → **New** → **Java Action**
2. 이름: `ParseBookmarkJson`
3. **Parameters**:
   - `BookmarkJson` (String, Input)
   - `ParsedItems` (List of Object, Output)

#### 2.2 Java 코드 예시

```java
import com.mendix.core.Core;
import com.mendix.systemwideinterfaces.core.IContext;
import com.mendix.systemwideinterfaces.core.IMendixObject;
import java.util.ArrayList;
import java.util.List;
import org.json.JSONArray;
import org.json.JSONObject;

public class ParseBookmarkJson {
    public static List<IMendixObject> parse(IContext context, String bookmarkJson) {
        List<IMendixObject> result = new ArrayList<>();
        
        try {
            JSONObject json = new JSONObject(bookmarkJson);
            JSONArray items = json.getJSONArray("items");
            
            for (int i = 0; i < items.length(); i++) {
                JSONObject item = items.getJSONObject(i);
                
                // 임시 엔티티 생성 (또는 실제 엔티티 사용)
                IMendixObject parsedItem = Core.instantiate(context, "PortalModule.ParsedBookmarkItem");
                
                parsedItem.setValue(context, "MenuId", item.getString("menuId"));
                parsedItem.setValue(context, "MenuName", item.getString("menuName"));
                parsedItem.setValue(context, "ParentId", 
                    item.isNull("parentId") ? null : item.getString("parentId"));
                parsedItem.setValue(context, "Depth", item.getInt("depth"));
                parsedItem.setValue(context, "SortNo", item.getInt("sortNo"));
                parsedItem.setValue(context, "LeftNo", item.getInt("leftNo"));
                parsedItem.setValue(context, "RightNo", item.getInt("rightNo"));
                
                result.add(parsedItem);
            }
        } catch (Exception e) {
            Core.getLogger("ParseBookmarkJson").error("JSON 파싱 실패: " + e.getMessage());
            throw new RuntimeException("JSON 파싱 실패", e);
        }
        
        return result;
    }
}
```

**주의**: `PortalModule.ParsedBookmarkItem` 엔티티를 먼저 생성해야 합니다.

### 방법 2: 임시 엔티티 사용 (더 간단)

#### 2.1 임시 엔티티 생성

**Domain Model**에서 새 엔티티 생성:
- 이름: `ParsedBookmarkItem`
- Persistable: `No` (임시 엔티티)
- 속성:
  - `MenuId` (String)
  - `MenuName` (String)
  - `ParentId` (String, Optional)
  - `Depth` (Integer)
  - `SortNo` (Integer)
  - `LeftNo` (Integer)
  - `RightNo` (Integer)

#### 2.2 JSON 파싱 Microflow (SUB_ParseBookmarkJson)

**방법 2-A: Community Commons 사용**

1. **Marketplace**에서 **Community Commons** 모듈 설치
2. Microflow `SUB_ParseBookmarkJson` 생성:
   - Parameter: `BookmarkJson` (String)
   - Return: `ParsedItems` (List of ParsedBookmarkItem)

```
[Start]
  → [Parameter: BookmarkJson (String)]
  → [Call Microflow: CommunityCommons.JsonToObject]
    Parameter: $BookmarkJson
    Return: $JsonObject
  → [Loop: $JsonObject/items]
    → [Create Object: ParsedBookmarkItem]
    → [Set Attribute: MenuId = $JsonItem/menuId]
    → [Set Attribute: MenuName = $JsonItem/menuName]
    → [Set Attribute: ParentId = $JsonItem/parentId]
    → [Set Attribute: Depth = $JsonItem/depth]
    → [Set Attribute: SortNo = $JsonItem/sortNo]
    → [Set Attribute: LeftNo = $JsonItem/leftNo]
    → [Set Attribute: RightNo = $JsonItem/rightNo]
  → [Return: $ParsedItems]
  → [End]
```

**방법 2-B: Java Action 사용 (위의 Java 코드 활용)**

---

## Step 3: 메인 Microflow 구현

### 3.1 Microflow 구조

```
[Start]
  → [Parameter: BookmarkJson (String)]
  → [Retrieve: CurrentUser]
  → [Retrieve: ExistingBookmarks]
  → [Delete Object: ExistingBookmarks]
  → [Call Microflow: SUB_ParseBookmarkJson]
  → [Loop: ParsedItems]
    → [Create Object: SyMenu_Bookmarked]
    → [Set Attributes]
    → [Create Associations]
  → [Commit]
  → [End]
```

### 3.2 상세 구현

#### 3.2.1 CurrentUser 조회

1. **Toolbox** → **Retrieve** 액티비티 추가
2. 설정:
   - **Entity**: `Administration.Account` 또는 `SyUser`
   - **XPath**: `[Id = $CurrentUser/Id]`
   - **Variable**: `$CurrentUser`

**또는** `$CurrentUser`를 직접 사용 (이미 컨텍스트에 있음)

#### 3.2.2 기존 북마크 조회 및 삭제

1. **Retrieve** 액티비티 추가:
   - **Entity**: `SyMenu_Bookmarked`
   - **Retrieve**: `By association`
   - **Association**: `SyMenu_Bookmarked_SyUser`
   - **Object**: `$CurrentUser`
   - **Variable**: `$ExistingBookmarks`

2. **Delete Object** 액티비티 추가:
   - **Object to delete**: `$ExistingBookmarks` (리스트)
   - **Delete behavior**: `Delete automatically`

#### 3.2.3 JSON 파싱

1. **Call Microflow** 액티비티 추가:
   - **Microflow**: `SUB_ParseBookmarkJson`
   - **Parameter**: `$BookmarkJson`
   - **Return**: `$ParsedItems` (List of ParsedBookmarkItem)

#### 3.2.4 새 북마크 생성 (Loop)

1. **Loop** 액티비티 추가:
   - **Loop over**: `$ParsedItems`
   - **Loop variable**: `$ParsedItem`

2. Loop 내부에 다음 액티비티 추가:

**Create Object:**
- **Entity**: `SyMenu_Bookmarked`
- **Variable**: `$NewBookmark`

**Set Attribute (MenuId):**
- **Object**: `$NewBookmark`
- **Attribute**: `MenuId`
- **Value**: `toInteger($ParsedItem/MenuId)` 또는 `$ParsedItem/MenuId` (이미 Integer인 경우)

**Set Attribute (MenuName):**
- **Object**: `$NewBookmark`
- **Attribute**: `MenuName`
- **Value**: `$ParsedItem/MenuName`

**Set Attribute (Description):**
- **Object**: `$NewBookmark`
- **Attribute**: `Description`
- **Value**: `$ParsedItem/Description` 또는 `""` (없는 경우)

**Set Attribute (ParentId):**
- **Object**: `$NewBookmark`
- **Attribute**: `ParentId`
- **Value**: `if($ParsedItem/ParentId = empty, empty, toInteger($ParsedItem/ParentId))`

**Set Attribute (Depth):**
- **Object**: `$NewBookmark`
- **Attribute**: `Depth`
- **Value**: `$ParsedItem/Depth`

**Set Attribute (SortNo):**
- **Object**: `$NewBookmark`
- **Attribute**: `SortNo`
- **Value**: `$ParsedItem/SortNo`

**Set Attribute (LeftNo):**
- **Object**: `$NewBookmark`
- **Attribute**: `LeftNo`
- **Value**: `$ParsedItem/LeftNo`

**Set Attribute (RightNo):**
- **Object**: `$NewBookmark`
- **Attribute**: `RightNo`
- **Value**: `$ParsedItem/RightNo`

**Set Attribute (DisplayYn):**
- **Object**: `$NewBookmark`
- **Attribute**: `DisplayYn`
- **Value**: `"Y"`

**Set Attribute (EnableTF):**
- **Object**: `$NewBookmark`
- **Attribute**: `EnableTF`
- **Value**: `true`

**Set Attribute (IsBookmarked):**
- **Object**: `$NewBookmark`
- **Attribute**: `IsBookmarked`
- **Value**: `true`

**Create Association (사용자 연결):**
- **Object**: `$NewBookmark`
- **Association**: `SyMenu_Bookmarked_SyUser`
- **Target**: `$CurrentUser`

**Change Object (부모 연결 - ParentId가 있는 경우):**
- **Object**: `$NewBookmark`
- **Change**: `Change association`
- **Association**: `SyMenu_Bookmarked_SyMenu_Bookmarked`
- **Target**: `$ParentBookmark` (아래에서 조회)

**부모 조회 (ParentId가 있는 경우):**
- **If** 액티비티 추가:
  - **Condition**: `$ParsedItem/ParentId != empty`
- **If True** 분기:
  - **Retrieve** 액티비티:
    - **Entity**: `SyMenu_Bookmarked`
    - **XPath**: `[MenuId = $ParsedItem/ParentId and SyMenu_Bookmarked_SyUser = $CurrentUser]`
    - **Variable**: `$ParentBookmark`
  - **Change Object**:
    - **Object**: `$NewBookmark`
    - **Change**: `Change association`
    - **Association**: `SyMenu_Bookmarked_SyMenu_Bookmarked`
    - **Target**: `$ParentBookmark`

#### 3.2.5 Commit

1. **Commit** 액티비티 추가 (Loop 외부)
2. **Object to commit**: `$NewBookmark` (Loop 내에서 생성된 객체들)
3. **Commit behavior**: `Yes` (자동 커밋)

**주의**: Loop 내에서 생성된 모든 객체는 하나의 트랜잭션으로 처리됩니다.

---

## Step 4: 에러 처리 추가

### 4.1 Error Handler 추가

1. Microflow **Settings** 탭에서:
   - **Error handling**: `Custom with rollback` 선택

2. **Error Handler** 액티비티 추가:
   - **Error message**: `"북마크 저장 중 오류가 발생했습니다: " + $Error`
   - **Show message**: `Yes`
   - **Log level**: `Error`

### 4.2 유효성 검사 추가

Loop 시작 전에 유효성 검사 추가:

```
[If: $ParsedItems = empty]
  → [Show Message: "저장할 북마크가 없습니다."]
  → [End]
```

---

## Step 5: 완성된 Microflow 예시

### 5.1 전체 구조

```
[Start]
  → [Parameter: BookmarkJson (String)]
  → [Retrieve: CurrentUser]
    Entity: Administration.Account
    XPath: [Id = $CurrentUser/Id]
    Variable: $CurrentUser
  → [Retrieve: ExistingBookmarks]
    Entity: SyMenu_Bookmarked
    Retrieve: By association
    Association: SyMenu_Bookmarked_SyUser
    Object: $CurrentUser
    Variable: $ExistingBookmarks
  → [Delete Object: ExistingBookmarks]
    Delete behavior: Delete automatically
  → [Call Microflow: SUB_ParseBookmarkJson]
    Parameter: $BookmarkJson
    Return: $ParsedItems
  → [If: $ParsedItems = empty]
    → [Show Message: "저장할 북마크가 없습니다."]
    → [End]
  → [Loop: $ParsedItems]
    → [Create Object: SyMenu_Bookmarked]
      Variable: $NewBookmark
    → [Set Attribute: MenuId = toInteger($ParsedItem/MenuId)]
    → [Set Attribute: MenuName = $ParsedItem/MenuName]
    → [Set Attribute: Description = if($ParsedItem/Description = empty, "", $ParsedItem/Description)]
    → [Set Attribute: ParentId = if($ParsedItem/ParentId = empty, empty, toInteger($ParsedItem/ParentId))]
    → [Set Attribute: Depth = $ParsedItem/Depth]
    → [Set Attribute: SortNo = $ParsedItem/SortNo]
    → [Set Attribute: LeftNo = $ParsedItem/LeftNo]
    → [Set Attribute: RightNo = $ParsedItem/RightNo]
    → [Set Attribute: DisplayYn = "Y"]
    → [Set Attribute: EnableTF = true]
    → [Set Attribute: IsBookmarked = true]
    → [Change Object: SyMenu_Bookmarked_SyUser]
      Object: $NewBookmark
      Association: SyMenu_Bookmarked_SyUser
      Target: $CurrentUser
    → [If: $ParsedItem/ParentId != empty]
      → [Retrieve: ParentBookmark]
        Entity: SyMenu_Bookmarked
        XPath: [MenuId = toInteger($ParsedItem/ParentId) and SyMenu_Bookmarked_SyUser = $CurrentUser]
        Variable: $ParentBookmark
      → [Change Object: SyMenu_Bookmarked_SyMenu_Bookmarked]
        Object: $NewBookmark
        Association: SyMenu_Bookmarked_SyMenu_Bookmarked
        Target: $ParentBookmark
  → [Commit]
    Object to commit: $NewBookmark (또는 전체 트랜잭션)
  → [Show Message: "북마크가 저장되었습니다."]
  → [End]

[Error Handler]
  → [Show Message: "북마크 저장 중 오류가 발생했습니다: " + $Error]
  → [Log: Error]
```

---

## Step 6: 위젯 연결

### 6.1 위젯 속성 설정

1. Mendix Studio Pro에서 DynamicNavigation 위젯 선택
2. **Properties** → **Behavior** → **On Bookmark Reorganize**
3. **Microflow** 선택: `ACT_BookmarkReorganize`

**주의**: 위젯에서 JSON 문자열을 파라미터로 전달하므로, Microflow 파라미터 타입이 `String`이어야 합니다.

---

## Step 7: 테스트

### 7.1 테스트 시나리오

1. 위젯에서 북마크 탭 선택
2. 설정 아이콘 클릭하여 편집 모드 진입
3. 드래그앤드롭으로 메뉴 재구성
4. "저장" 버튼 클릭
5. Microflow 실행 확인
6. 데이터베이스에서 북마크 구조 확인

### 7.2 디버깅

1. **Microflow 디버깅**:
   - Microflow 실행 시 **Debug** 모드 활성화
   - 각 액티비티의 변수 값 확인
   - JSON 파싱 결과 확인

2. **위젯 디버깅**:
   - 브라우저 개발자 도구 (F12)
   - Console 탭에서 JSON 문자열 확인
   - Network 탭에서 Action 호출 확인

---

## 주의사항

### 1. 트랜잭션 관리

- **Commit은 한 번만**: Loop 내에서 Commit하지 마세요
- **에러 시 롤백**: Error Handler가 있으면 자동 롤백됩니다
- **트랜잭션 범위**: Microflow 전체가 하나의 트랜잭션입니다

### 2. JSON 파싱

- Mendix는 JSON 파싱을 직접 지원하지 않습니다
- Java Action 또는 Community Commons 사용 필요
- 또는 임시 엔티티를 사용하여 단계별로 파싱

### 3. 데이터 타입 변환

- JSON의 `menuId`는 String일 수 있으므로 `toInteger()` 사용
- `parentId`가 `null`인 경우 `empty`로 처리
- Boolean 값은 그대로 사용 가능

### 4. 성능 고려

- 대량의 북마크가 있는 경우, 배치 처리 고려
- Loop 내에서 불필요한 Retrieve 최소화
- 인덱스 설정 확인 (`MenuId`, `ParentId`)

---

## 문제 해결

### 문제: JSON 파싱이 안됨

**해결**:
1. Java Action이 올바르게 구현되었는지 확인
2. JSON 문자열 형식 확인 (브라우저 개발자 도구)
3. Community Commons 모듈이 설치되었는지 확인

### 문제: 부모-자식 관계가 연결되지 않음

**해결**:
1. ParentId가 올바르게 파싱되었는지 확인
2. 부모 북마크가 먼저 생성되었는지 확인 (SortNo 순서)
3. XPath에서 사용자 조건 포함 확인

### 문제: 트랜잭션 롤백됨

**해결**:
1. Error Handler에서 에러 메시지 확인
2. 필수 속성이 모두 설정되었는지 확인
3. Association이 올바르게 설정되었는지 확인

---

**작성일**: 2025-01-XX  
**버전**: 1.0
