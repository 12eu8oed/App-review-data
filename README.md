# Play Store Review Exporter Pro 🚀

Google Play 스토어의 리뷰 데이터를 간편하게 추출하고 분석할 수 있는 웹 어플리케이션입니다.

## 🛠 Tech Stack (기술 스택)

### Frontend
- **React 18**: 컴포넌트 기반의 사용자 인터페이스 구축을 위한 메인 라이브러리.
- **TypeScript**: 정적 타입을 지원하여 코드의 안정성과 유지보수성을 향상.
- **Vite**: 초고속 빌드 도구 및 개발 서버.
- **Tailwind CSS**: 유틸리티 우선(Utility-first) CSS 프레임워크로 빠르고 일관된 디자인 구현.
- **Motion (framer-motion)**: 부드럽고 인터랙티브한 UI 애니메이션 구현.
- **Lucide React**: 일관성 있고 깔끔한 벡터 아이콘 라이브러리.
- **XLSX (SheetJS)**: 수집된 데이터를 엑셀(Excel) 파일로 변환 및 다운로드 기능 제공.

### Backend (API)
- **Node.js & Express**: API 요청 처리를 위한 경량 서버 프레임워크.
- **google-play-scraper**: Google Play 스토어에서 앱 정보 및 리뷰를 크롤링하는 핵심 라이브러리.
- **Vercel Serverless Functions**: 백엔드 인프라 관리 없이 API를 배포하고 확장하기 위한 서버리스 아키텍처.

### Deployment
- **Vercel**: 프론트엔드 호스팅 및 백엔드 API 서버리스 배포를 위한 플랫폼.

## ✨ Key Features (주요 기능)

1. **리뷰 데이터 추출**: 앱 ID 또는 URL만으로 수천 건의 리뷰를 실시간으로 수집.
2. **정교한 필터링**: 평점(1~5점), 기간, 특정 키워드별 필터링 기능.
3. **엑셀 내보내기**: 필터링된 결과물만 선택적으로 엑셀 파일로 저장하여 업무 활용도 극대화.
4. **리뷰 상세 보기**: 목록에서 행 클릭 시 전체 리뷰 내용 및 개발자 답변을 팝업으로 확인.
5. **검색 기록 저장**: LocalStorage를 활용하여 최근에 조회한 앱을 빠르게 재검색.
6. **반응형 디자인**: 모바일, 태블릿, 데스크탑 등 모든 기기 환경에 최적화된 레이아웃.

## 📁 Project Structure
- `/src`: 프론트엔드 React 소스 코드
- `/api`: Vercel 배포를 위한 서버리스 API 서버 코드 (Express)
- `/vercel.json`: Vercel 배포 설정 (API 라우팅 레이어)
