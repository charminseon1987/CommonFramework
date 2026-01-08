# Mendix Team Server Git 커밋 및 푸시 가이드

## 📋 작업 개요

**날짜**: 2024년 12월 24일  
**프로젝트**: DynamicFramework-main  
**작업 내용**: CustomWidget 소스 코드를 Mendix Team Server에 커밋 및 푸시

---

## 🎯 목표

- Mendix 프로젝트 파일을 Team Server에 커밋
- CustomWidget 폴더를 Team Server에 함께 커밋
- 팀원들이 Update로 Widget 소스 코드를 받을 수 있도록 설정




### 버전 관리 시스템 확인

cd "C:\Users\SBT Global\Mendix\DynamicFramework-main"
git remote -v

**결과**:
```
origin  https://git.api.mendix.com/1c151506-dbc1-4490-b046-d0806f337fc0.git/ (fetch)
origin  https://git.api.mendix.com/1c151506-dbc1-4490-b046-d0806f337fc0.git/ (push)
```

**확인 사항**:
- ✅ Mendix Team Server 사용 중
- ✅ Git 기반 (SVN 아님)
- ✅ Studio Pro의 Version Control → Commit = Git 커밋

---

## ✅ 해결 방법

### 1단계: Personal Access Token (PAT) 생성

#### Mendix Portal 접속
1. https://sprintr.home.mendix.com 로그인
2. 우측 상단 프로필 클릭 → **My Profile**
3. 왼쪽 메뉴 **API Keys** 클릭
4. **Personal Access Tokens** 탭 선택

#### 토큰 생성
1. **New Token** 또는 **Create New Token** 클릭
2. Token name: `Git Access` 입력
3. **Defined Scopes** 섹션에서 권한 선택:
   - ☑️ `mx:modelrepository:repo:write` (Write access to Team Server Git)
   - ☑️ `mx:modelrepository:repo:read` (Read access to Team Server Git)
4. **Create** 버튼 클릭
5. **생성된 토큰 복사** (한 번만 표시됨!)
   - 형식: `mxpat-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`


**빌드 파일이 제외되는지 확인**:

```gitignore
# .gitignore 내용
**/node_modules/
**/dist/
**/package-lock.json
**/typings/
**/cypress/
```

**중요**: CustomWidget 소스는 포함하되, 빌드 파일만 제외

---

### 5단계: Git 커밋 및 푸시

```powershell
# 프로젝트 폴더로 이동
cd "C:\Users\SBT Global\Mendix\DynamicFramework-main"

# 현재 상태 확인
git status

# 모든 변경사항 추가 (CustomWidget 포함)
git add .

# 커밋
git commit -m "commit message"



# Mendix Team Server에 푸시
git push origin main
```

---

### 6단계: 인증 정보 입력

**푸시 시 인증 창이 나타남**:

```
Username for 'https://git.api.mendix.com': hyeseon.kim@sbtglobal.com
Password for 'https://git.api.mendix.com': [TokenAccess]
```

**주의**: Password에는 Mendix 비밀번호가 아니라 **Personal Access Token**을 입력!

-

## 📁 업로드된 파일 구조

```
DynamicFramework-main/
├── YourMendixProject/
│   ├── pages/
│   ├── domain/
│   └── widgets/
│       └── DynamicNavigation.mpk
├── CustomWidget/              ← ✅ 업로드됨
│   └── CommonFramework/
│       ├── src/               ← ✅ 소스 코드
│       │   ├── DynamicNavigation.tsx
│       │   ├── components/
│       │   │   ├── NavigationMenu.tsx
│       │   │   └── horizontal/
│       │   ├── utils/
│       │   │   └── menuHelpers.ts
│       │   └── types/
│       ├── package.json       ← ✅ 포함
│       ├── tsconfig.json      ← ✅ 포함
│       ├── .gitignore
│       └── README.md
├── .gitignore
└── README.md
```

---

## 👥 팀원이 업데이트 받는 방법

### Option 1: Studio Pro에서

1. Mendix Studio Pro 열기
2. **Version Control** → **Update** (Ctrl+Shift+U)
3. CustomWidget 폴더도 함께 다운로드됨

### Option 2: Git 명령줄

cd "프로젝트경로"
git pull origin main
```

### Widget 개발 환경 설정

```powershell
# CustomWidget 폴더로 이동
cd CustomWidget/CommonFramework

# 의존성 설치
npm install

# Widget 빌드
npm run build
```

---

### Widget 개발 및 커밋 프로세스


# 1. Widget 코드 수정
cd "C:\Users\SBT Global\Mendix\DynamicFramework-main\CustomWidget\CommonFramework"
# 코드 편집...

# 2. Widget 빌드
npm run build

# 3. Mendix 프로젝트에서 테스트
# Studio Pro에서 F4 (Run Locally)

# 4. 변경사항 커밋
cd "C:\Users\SBT Global\Mendix\DynamicFramework-main"
git add .
git commit -m "Update widget feature"

# 5. Team Server에 푸시 (인증 정보 저장되어 있음)
git push origin main
```

**중요**: Personal Access Token이 Windows Credential Manager에 저장되어 있으므로 다시 입력할 필요 없음!

---

## 📊 Studio Pro vs Git 명령줄 비교

| 항목 | Studio Pro | Git 명령줄 |
|------|-----------|-----------|
| **Mendix 파일 커밋** | ⚠️ CustomWidget 에러 | ✅ 정상 작동 |
| **CustomWidget 커밋** | ❌ 불가능 (에러) | ✅ 정상 작동 |
| **속도** | 느림 | 빠름 |
| **안정성** | 버그 존재 | 안정적 |
| **사용 편의성** | GUI | 명령줄 |
| **권장 사항** | 사용 안 함 | **✅ 권장** |

---

## ⚠️ 주의사항

### Personal Access Token 보안

- ✅ **절대 공유하지 마세요**
- ✅ 안전한 곳에 백업
- ✅ 주기적으로 재생성 권장
- ✅ 만료 기간 설정 권장

### .gitignore 필수 항목

```gitignore
# 반드시 제외해야 할 항목
**/node_modules/         # npm 의존성
**/dist/                 # 빌드 결과물
**/package-lock.json     # 락 파일
**/typings/              # TypeScript 타입 정의
**/cypress/              # 테스트 파일
```



# .gitignore 확인
cat .gitignore

# 다시 추가 및 커밋
git add .
git commit -m "Remove build files"
git push origin main
```


---

## 🎯 핵심 요약

### ✅ 성공 요인

1. **Personal Access Token 생성** 
    git AccessToken : 
   - Mendix Portal에서 올바른 권한으로 생성
   - Model Repository read/write 권한

2. **Git 명령줄 사용**
   - Studio Pro 버그 우회
   - 더 안정적이고 빠름

3. **.gitignore 설정**
   - 빌드 파일 제외
   - 소스 코드만 커밋

4. **Credential Helper 설정**
   - 인증 정보 자동 저장
   - 매번 입력 불필요

---

## 📞 추가 도움

### Mendix 공식 문서
- Team Server: https://docs.mendix.com/developerportal/collaborate/team-server/
- Git 사용: https://docs.mendix.com/refguide/using-version-control-in-studio-pro/

### Git 학습 자료
- Git 공식 문서: https://git-scm.com/doc
- Git 튜토리얼: https://www.atlassian.com/git/tutorials

---

## 📝 작성 정보

- **작성자**: CBG Development Team
- **작성일**: 2025년 12월 24일
- **프로젝트**: DynamicFramework-main
- **Widget**: DynamicNavigation

---
