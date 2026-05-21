// 구글 스프레드시트 1:N 관계형 병원 & 후기 실시간 연동 스크립트 (V2 - 실시간 후기 작성 & 병원 제보 API 공용 탑재)
// 구글 Apps Script 편집기(확장 프로그램 > Apps Script)에 기존 코드를 지우고 이 스크립트 전체를 덮어쓰기하여 배포하세요.
// ⚠️ 보안 강화 (CORS & DB 노출 방지): 
// 구글 스프레드시트 ID는 구글 Apps Script 편집기의 [프로젝트 설정(톱니바퀴) > 스크립트 속성] 메뉴에
// 'SPREADSHEET_ID'라는 이름(Key)으로 실제 시트 ID를 등록해 두고 안전하게 읽어오는 방식(방법 B)을 사용합니다.
// 만약 스크립트 속성을 등록하지 않는다면 아래의 기본 문자열 상수를 참조합니다.
const SPREADSHEET_ID = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID') || "YOUR_SPREADSHEET_ID_HERE";


/**
 * 1. GET API: 병원 리스트와 후기를 Join하여 반응형 JSON 배열로 반환
 * - status가 'pending' 혹은 'inactive'인 제보 대기 상태의 병원은 보안/안전을 위해 노출 리스트에서 배제합니다.
 */
function doGet(e) {
  try {
    // -------------------------------------------------------------
    // [보안] 허용된 Origin 검증 (클라이언트 브라우저가 전송한 origin 파라미터 확인)
    // -------------------------------------------------------------
    const clientOrigin = (e && e.parameter && e.parameter.origin) || "";
    const ALLOWED_ORIGINS = [
      "https://jjuuuunn.github.io", 
      "http://localhost:5173", 
      "http://localhost:3000",
      "http://127.0.0.1:5173"
    ];
    
    const isAllowed = ALLOWED_ORIGINS.some(allowed => clientOrigin.startsWith(allowed));
    if (!isAllowed) {
      return ContentService.createTextOutput(JSON.stringify({ 
        status: "error",
        message: "Access Denied: Unapproved origin (" + clientOrigin + ")" 
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    // Hospitals 시트 데이터 로드
    const hospitalsSheet = ss.getSheetByName("Hospitals");
    const hospitalsData = hospitalsSheet.getDataRange().getValues();
    const hospitalsHeaders = hospitalsData[0];
    const hospitalsRows = hospitalsData.slice(1);
    
    // Reviews 시트 데이터 로드
    const reviewsSheet = ss.getSheetByName("Reviews");
    let reviewsMap = {};
    
    if (reviewsSheet) {
      const reviewsData = reviewsSheet.getDataRange().getValues();
      const reviewsHeaders = reviewsData[0];
      const reviewsRows = reviewsData.slice(1);
      
      const idIdx = reviewsHeaders.indexOf("hospitalId");
      const authorIdx = reviewsHeaders.indexOf("author");
      const isSuccessIdx = reviewsHeaders.indexOf("isSuccess");
      const actualFeeIdx = reviewsHeaders.indexOf("actualFee");
      const contentIdx = reviewsHeaders.indexOf("content");
      const dateIdx = reviewsHeaders.indexOf("date");
      
      reviewsRows.forEach(row => {
        const hospitalId = String(row[idIdx]);
        if (!hospitalId) return;
        
        // 날짜 예쁘게 포맷팅
        let rawDate = row[dateIdx];
        let dateStr = "";
        if (rawDate instanceof Date) {
          dateStr = Utilities.formatDate(rawDate, "GMT+9", "yyyy-MM-dd");
        } else {
          dateStr = String(rawDate);
        }
        
        const reviewObj = {
          author: String(row[authorIdx]),
          isSuccess: row[isSuccessIdx] === true || String(row[isSuccessIdx]).toLowerCase() === "true" || row[isSuccessIdx] === "성공" || row[isSuccessIdx] === "발급 성공",
          actualFee: String(row[actualFeeIdx]),
          content: String(row[contentIdx]),
          date: dateStr
        };
        
        if (!reviewsMap[hospitalId]) {
          reviewsMap[hospitalId] = [];
        }
        reviewsMap[hospitalId].push(reviewObj);
      });
    }
    
    // Hospitals와 Reviews 조인하여 JSON 빌드
    const headers = hospitalsHeaders;
    const nameIdx = headers.indexOf("name");
    const idIdx = headers.indexOf("id");
    const addressIdx = headers.indexOf("address");
    const telIdx = headers.indexOf("tel");
    const feeIdx = headers.indexOf("fee");
    const latIdx = headers.indexOf("lat");
    const lngIdx = headers.indexOf("lng");
    const statusIdx = headers.indexOf("status");
    const lastUpdatedIdx = headers.indexOf("lastUpdated");
    const tagsIdx = headers.indexOf("tags");
    const tipsIdx = headers.indexOf("tips");
    const kakaoIdIdx = headers.indexOf("kakaoPlaceId");
    const naverIdIdx = headers.indexOf("naverPlaceId");
    
    const result = [];
    
    hospitalsRows.forEach(row => {
      const hospitalId = String(row[idIdx]);
      const statusValue = String(row[statusIdx]).toLowerCase();
      
      // ⚠️ 제보되었으나 승인 대기(pending) 또는 비활성화(inactive) 상태인 병원도 클라이언트 필터 구현을 위해 반환합니다.
      // if (statusValue === "pending" || statusValue === "inactive") {
      //   return;
      // }
      
      // 태그 파싱 (콤마 분할)
      let tagsArray = [];
      const rawTags = String(row[tagsIdx]);
      if (rawTags) {
        tagsArray = rawTags.split(",").map(t => t.trim());
      }
      
      // 날짜 포맷팅
      let lastUpdatedStr = "";
      let rawUpdate = row[lastUpdatedIdx];
      if (rawUpdate instanceof Date) {
        lastUpdatedStr = Utilities.formatDate(rawUpdate, "GMT+9", "yyyy-MM-dd");
      } else {
        lastUpdatedStr = String(rawUpdate);
      }
      
      result.push({
        id: hospitalId,
        name: String(row[nameIdx]),
        address: String(row[addressIdx]),
        tel: String(row[telIdx]),
        fee: String(row[feeIdx]),
        lat: Number(row[latIdx]) || 0,
        lng: Number(row[lngIdx]) || 0,
        status: String(row[statusIdx]) || "active",
        lastUpdated: lastUpdatedStr,
        tags: tagsArray,
        tips: String(row[tipsIdx]),
        kakaoPlaceId: String(row[kakaoIdIdx] || ""),
        naverPlaceId: String(row[naverIdIdx] || ""),
        reviews: reviewsMap[hospitalId] || []
      });
    });
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 2. POST API: 신규 후기 등록 및 신규 병원 제보(action 분기 처리)
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    // 30초 동시성 대기 잠금 설정
    lock.waitLock(30000);
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    // POST 페이로드 파싱
    const postData = JSON.parse(e.postData.contents);
    
    // -------------------------------------------------------------
    // [보안] 허용된 Origin 검증 (클라이언트가 페이로드로 전송한 origin 확인)
    // -------------------------------------------------------------
    const clientOrigin = postData.origin || "";
    const ALLOWED_ORIGINS = [
      "https://jjuuuunn.github.io", 
      "http://localhost:5173", 
      "http://localhost:3000",
      "http://127.0.0.1:5173"
    ];
    
    const isAllowed = ALLOWED_ORIGINS.some(allowed => clientOrigin.startsWith(allowed));
    if (!isAllowed) {
      throw new Error("Access Denied: Unapproved origin (" + clientOrigin + ")");
    }
    
    const action = postData.action || "addReview"; // 기본값은 하위 호환성을 위해 addReview
    
    // 현재 KST 한국 날짜 문자열 빌드 (YYYY-MM-DD)
    const kstDateStr = Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd");
    
    // -------------------------------------------------------------
    // 분기 A: 신규 다이버 후기를 실시간 스프레드시트에 기입
    // -------------------------------------------------------------
    if (action === "addReview") {
      const reviewsSheet = ss.getSheetByName("Reviews");
      if (!reviewsSheet) {
        throw new Error("Reviews 시트를 찾을 수 없습니다.");
      }
      
      const hospitalId = String(postData.hospitalId || "").trim();
      const author = String(postData.author || "").trim();
      const isSuccess = postData.isSuccess; // Boolean
      const actualFee = String(postData.actualFee || "").trim();
      const content = String(postData.content || "").trim();
      
      if (!hospitalId || !author || !content) {
        throw new Error("필수 입력 항목(병원ID, 닉네임, 후기 내용)이 누락되었습니다.");
      }
      
      // Reviews 시트 헤더 목록 기반으로 컬럼 인덱스 매핑 찾기
      const reviewsData = reviewsSheet.getDataRange().getValues();
      const headers = reviewsData[0];
      
      const hospitalIdIdx = headers.indexOf("hospitalId");
      const authorIdx = headers.indexOf("author");
      const isSuccessIdx = headers.indexOf("isSuccess");
      const actualFeeIdx = headers.indexOf("actualFee");
      const contentIdx = headers.indexOf("content");
      const dateIdx = headers.indexOf("date");
      
      if (hospitalIdIdx === -1 || authorIdx === -1 || isSuccessIdx === -1 || contentIdx === -1) {
        throw new Error("Reviews 시트의 헤더 구조가 일치하지 않습니다.");
      }
      
      const newRow = [];
      headers.forEach((_, idx) => {
        if (idx === hospitalIdIdx) newRow.push(hospitalId);
        else if (idx === authorIdx) newRow.push(author);
        else if (idx === isSuccessIdx) newRow.push(isSuccess);
        else if (idx === actualFeeIdx) newRow.push(actualFee);
        else if (idx === contentIdx) newRow.push(content);
        else if (idx === dateIdx) newRow.push(kstDateStr);
        else newRow.push("");
      });
      
      reviewsSheet.appendRow(newRow);
      
      const responseObj = {
        status: "success",
        message: "후기가 성공적으로 등록되었습니다.",
        insertedData: {
          hospitalId: hospitalId,
          author: author,
          isSuccess: isSuccess,
          actualFee: actualFee,
          content: content,
          date: kstDateStr
        }
      };
      
      return ContentService.createTextOutput(JSON.stringify(responseObj))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // -------------------------------------------------------------
    // 분기 B: 다이버가 새로운 발급 가능 병원을 실시간 제보(검수 대기 등록)
    // -------------------------------------------------------------
    else if (action === "suggestHospital") {
      const hospitalsSheet = ss.getSheetByName("Hospitals");
      if (!hospitalsSheet) {
        throw new Error("Hospitals 시트를 찾을 수 없습니다.");
      }
      
      const name = String(postData.name || "").trim();
      const address = String(postData.address || "").trim();
      const tel = String(postData.tel || "").trim();
      const fee = String(postData.fee || "").trim();
      const tips = String(postData.tips || "").trim();
      const tags = String(postData.tags || "").trim();
      
      if (!name || !address) {
        throw new Error("필수 입력 항목(병원명, 병원 주소)이 누락되었습니다.");
      }
      
      // Hospitals 시트 데이터 로드 및 헤더 기반 컬럼 맵핑
      const hospitalsData = hospitalsSheet.getDataRange().getValues();
      const headers = hospitalsData[0];
      
      const idIdx = headers.indexOf("id");
      const nameIdx = headers.indexOf("name");
      const addressIdx = headers.indexOf("address");
      const telIdx = headers.indexOf("tel");
      const feeIdx = headers.indexOf("fee");
      const latIdx = headers.indexOf("lat");
      const lngIdx = headers.indexOf("lng");
      const statusIdx = headers.indexOf("status");
      const lastUpdatedIdx = headers.indexOf("lastUpdated");
      const tagsIdx = headers.indexOf("tags");
      const tipsIdx = headers.indexOf("tips");
      const kakaoIdIdx = headers.indexOf("kakaoPlaceId");
      const naverIdIdx = headers.indexOf("naverPlaceId");
      
      if (idIdx === -1 || nameIdx === -1 || addressIdx === -1) {
        throw new Error("Hospitals 시트의 헤더 구조가 일치하지 않습니다.");
      }
      
      // 고유 ID 자동 계산 (기존 ID의 최대 숫자값을 정교히 추출해 1 증가)
      let nextIdNum = 1;
      const lastRowIdx = hospitalsSheet.getLastRow();
      if (lastRowIdx > 1) {
        const lastIdVal = String(hospitalsSheet.getRange(lastRowIdx, 1).getValue());
        const match = lastIdVal.match(/\d+/);
        if (match) {
          nextIdNum = parseInt(match[0], 10) + 1;
        } else {
          nextIdNum = lastRowIdx;
        }
      }
      const nextId = "h" + nextIdNum;
      
      // 신규 제보 행 데이터 배열 작성
      const newRow = [];
      headers.forEach((_, idx) => {
        if (idx === idIdx) newRow.push(nextId);
        else if (idx === nameIdx) newRow.push(name);
        else if (idx === addressIdx) newRow.push(address);
        else if (idx === telIdx) newRow.push(tel || "정보 없음");
        else if (idx === feeIdx) newRow.push(fee || "변동성 (제보 검수 대기)");
        else if (idx === latIdx) newRow.push(0); // 관리자가 시트에서 직접 좌표 정산할 수 있도록 0 대입
        else if (idx === lngIdx) newRow.push(0); // 관리자가 시트에서 직접 좌표 정산할 수 있도록 0 대입
        else if (idx === statusIdx) newRow.push("pending"); // ⚠️ 승인 대기 상태로 적재
        else if (idx === lastUpdatedIdx) newRow.push(kstDateStr);
        else if (idx === tagsIdx) newRow.push(tags || "다이버제보");
        else if (idx === tipsIdx) newRow.push(tips || "사용자가 제안한 신규 발급 가능 병원입니다.");
        else if (idx === kakaoIdIdx) newRow.push("");
        else if (idx === naverIdIdx) newRow.push("");
        else newRow.push("");
      });
      
      // 행 삽입
      hospitalsSheet.appendRow(newRow);
      
      const responseObj = {
        status: "success",
        message: "병원이 제안되었으며, 관리자 검토 대기(pending) 상태로 기록되었습니다.",
        insertedData: {
          id: nextId,
          name: name,
          address: address,
          status: "pending",
          date: kstDateStr
        }
      };
      
      return ContentService.createTextOutput(JSON.stringify(responseObj))
        .setMimeType(ContentService.MimeType.JSON);
    } 
    
    // 분기 예외
    else {
      throw new Error("정의되지 않은 API Action 요청입니다.");
    }
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      status: "error", 
      message: error.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
    
  } finally {
    // 락 해제
    lock.releaseLock();
  }
}
