# SyMenu_Bookmarked 엔티티 구조

## 엔티티 개요

`SyMenu_Bookmarked` 엔티티는 사용자별로 북마크를 재구성하여 저장하는 엔티티입니다.

## 속성 (Attributes)

| 속성명 | 타입 | 설명 | 예시 |
|--------|------|------|------|
| `MenuId` | Integer | 메뉴 고유 식별자 | 1, 2, 3 |
| `MenuName` | String | 메뉴 표시 이름 | "홈", "설정" |
| `Description` | String | 메뉴 설명 | "홈 페이지로 이동" |
| `ParentId` | Integer | 부모 메뉴 ID (null 가능) | null 또는 부모 MenuId |
| `Depth` | Integer | 계층 깊이 (0부터 시작) | 0, 1, 2 |
| `SortNo` | Integer | 같은 레벨 내 정렬 순서 | 0, 1, 2 |
| `LeftNo` | Integer | Nested Set Model 좌측 번호 | 1, 2, 3 |
| `RightNo` | Integer | Nested Set Model 우측 번호 | 2, 3, 4 |
| `DisplayYn` | String | 표시 여부 | "Y" 또는 "N" |
| `EnableTF` | Boolean | 활성화 여부 | true, false |
| `IsBookmarked` | Boolean | 북마크 여부 | true, false |

## 관계 (Associations)

### 1. SyMenu_Bookmarked_SyUser (Many-to-One)

- **관계 타입**: Many-to-One
- **연결 엔티티**: `SyUser` (Administration.Account)
- **설명**: 여러 북마크 항목이 하나의 사용자에 속함
- **XPath 예시**: `[SyMenu_Bookmarked_SyUser = $CurrentUser]`

### 2. SyMenu_Bookmarked_SyMenu_Bookmarked (1-to-Many, 자기 참조)

- **관계 타입**: 1-to-Many (자기 참조)
- **연결 엔티티**: `SyMenu_Bookmarked`
- **설명**: 부모-자식 관계를 나타냄 (폴더 구조)
- **XPath 예시**: 
  - 부모 찾기: `[SyMenu_Bookmarked_SyMenu_Bookmarked = $ParentBookmark]`
  - 자식 찾기: `[SyMenu_Bookmarked_SyMenu_Bookmarked/ParentId = $CurrentBookmark/MenuId]`

## 데이터 구조 예시

### 예시 1: 단순 북마크

```
사용자: User1
├─ MenuId: 1, MenuName: "홈", ParentId: null, Depth: 0
├─ MenuId: 2, MenuName: "설정", ParentId: null, Depth: 0
└─ MenuId: 3, MenuName: "도움말", ParentId: null, Depth: 0
```

### 예시 2: 폴더 구조

```
사용자: User1
├─ MenuId: 1, MenuName: "홈", ParentId: null, Depth: 0
├─ MenuId: 10, MenuName: "내 폴더", ParentId: null, Depth: 0
│   ├─ MenuId: 2, MenuName: "설정", ParentId: 10, Depth: 1
│   └─ MenuId: 3, MenuName: "도움말", ParentId: 10, Depth: 1
└─ MenuId: 4, MenuName: "로그아웃", ParentId: null, Depth: 0
```

## Nested Set Model

LeftNo와 RightNo를 사용하여 트리 구조를 효율적으로 쿼리할 수 있습니다.

### 계산 방법

```
노드 방문 순서:
1. 노드 진입 → LeftNo 설정
2. 모든 자식 노드 처리
3. 노드 종료 → RightNo 설정
```

### 예시

```
        A (LeftNo: 1, RightNo: 8)
       / \
      B   C (LeftNo: 5, RightNo: 6)
     /|\
    D E F (LeftNo: 2, RightNo: 4)
```

- A의 자식 찾기: `[LeftNo > 1 and RightNo < 8]`
- B의 자식 찾기: `[LeftNo > 2 and RightNo < 4]`
- A의 모든 하위 노드: `[LeftNo >= 1 and RightNo <= 8]`

## Microflow에서 사용 예시

### 1. 사용자의 모든 북마크 조회

```
[Retrieve]
Entity: SyMenu_Bookmarked
XPath: [SyMenu_Bookmarked_SyUser = $CurrentUser]
```

### 2. 특정 부모의 자식 북마크 조회

```
[Retrieve]
Entity: SyMenu_Bookmarked
XPath: [SyMenu_Bookmarked_SyMenu_Bookmarked = $ParentBookmark]
```

### 3. 루트 레벨 북마크만 조회

```
[Retrieve]
Entity: SyMenu_Bookmarked
XPath: [SyMenu_Bookmarked_SyUser = $CurrentUser and ParentId = null]
```

### 4. 특정 깊이의 북마크 조회

```
[Retrieve]
Entity: SyMenu_Bookmarked
XPath: [SyMenu_Bookmarked_SyUser = $CurrentUser and Depth = 0]
```

## 주의사항

1. **MenuId 중복**: 같은 사용자 내에서 MenuId가 중복될 수 있으므로, 조회 시 사용자 조건을 반드시 포함해야 합니다.

2. **ParentId와 Association**: ParentId 속성과 `SyMenu_Bookmarked_SyMenu_Bookmarked` 관계는 함께 사용되어야 합니다.

3. **트랜잭션**: 북마크 재구성 시 모든 변경사항을 하나의 트랜잭션으로 처리해야 합니다.

4. **LeftNo, RightNo 계산**: 트리 구조가 변경될 때마다 LeftNo와 RightNo를 재계산해야 합니다. **위젯에서 자동으로 계산되어 JSON에 포함되므로, Mendix Microflow에서는 별도 계산이 필요 없습니다.**

5. **트랜잭션 처리**: 
   - **위젯**: 변경사항을 메모리 상태(React state)로만 관리 (트랜잭션 없음)
   - **Mendix Microflow**: 데이터베이스 저장 시 트랜잭션 자동 처리
   - Microflow 실행 중 에러 발생 시 자동 롤백 (모든 변경사항 취소)
