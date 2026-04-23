# 앱사용자 리뷰 데이터 추출기 (App Store & Play Store Review Exporter) 🚀

Google Play 스토어와 Apple App Store의 리뷰 데이터를 간편하게 추출하고 분석할 수 있는 웹 어플리케이션입니다.

## 🛠 Tech Stack (기술 스택)

### Frontend
- **React 18**: 컴포넌트 기반의 사용자 인터페이스 구축을 위한 메인 라이브러리.
- **TypeScript**: 정적 타입을 지원하여 코드의 안정성과 유지보수성을 향상.
- **Vite & Vite PWA**: 초고속 빌드 및 데스크탑/모바일 기기 앱 설치(PWA) 지원.
- **Tailwind CSS**: 유틸리티 우선(Utility-first) CSS 프레임워크로 빠르고 일관된 디자인 구현.
- **Motion (framer-motion)**: 부드럽고 인터랙티브한 UI 애니메이션 구현.
- **Lucide React**: 일관성 있고 깔끔한 벡터 아이콘 라이브러리.
- **XLSX (SheetJS)**: 수집된 데이터를 엑셀(Excel) 파일로 변환 및 다운로드 기능 제공.

### Backend (API)
- **Node.js & Express**: API 요청 처리를 위한 경량 서버 프레임워크.
- **google-play-scraper**: Google Play 스토어 앱 정보 및 리뷰 크롤링.
- **app-store-scraper**: Apple App Store 앱 정보 및 리뷰 크롤링.
- **Vercel Serverless Functions**: 배포 환경에서 백엔드 인프라 관리 없이 API를 활용하기 위한 서버리스 아키텍처.

## ✨ Key Features (주요 기능 - V2.0 업데이트)

1. **양대 마켓(Android/iOS) 통합 리뷰 추출**: Google Play와 Apple App Store 플랫폼 간 손쉬운 전환 및 데이터 수집.
2. **스마트 링크 자동 감지**: 앱/플레이 스토어 링크(URL)를 복사해서 붙여넣기만 하면, 스토어 종류와 앱 고유 ID를 자동으로 판별해 세팅.
3. **수집 기준(정렬) 커스터마이징**: '최신순' 뿐만 아니라 '유용한 순(Helpful)'으로 정렬하여 과거에 많은 공감을 받은 핵심 리뷰들을 수집 가능.
4. **정교한 필터링 & 검색**: 평점(1~5점), 기간 범위, **특정 키워드(단어)** 별 실시간 클라이언트 사이드 필터링 기능. 시차(Timezone) 문제를 해결한 정확한 날짜 기준 매칭 제공.
5. **통합 엑셀 내보내기**: 추출된 플랫폼("스토어" 열 추가), 깔끔한 한국식 날짜 표기(YYYY. MM. DD.)를 포함해 실무에 즉시 투입 가능한 엑셀 파일 저장 기능.
6. **앱 설치 지원 (PWA)**: 다운로드나 앱스토어 심사 없이 언제든 PC/스마트폰 바탕화면에 앱처럼 설치해 사용 가능.

## 📁 Project Structure
- `/src`: 프론트엔드 React 소스 코드
- `/api`: Vercel 배포를 위한 서버리스 API 서버 코드 (Express)
- `server.ts`: 로컬 개발 전용 API 서버 모듈
- `/vercel.json`: Vercel 배포 시 API 라우팅 레이어 설정
