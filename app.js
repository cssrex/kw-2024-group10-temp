var mapContainer = document.getElementById('map'), // 지도를 표시할 div  
    mapOption = {
        center: new kakao.maps.LatLng(37.619623, 127.059799), // 지도의 중심좌표
        level: 3 // 지도의 확대 레벨
    };

var map = new kakao.maps.Map(mapContainer, mapOption); // 지도를 생성합니다

// 이미지 마커의 옵션을 설정
var imageSrc = './images/marker.png'; // 마커 이미지의 경로
var imageSize = new kakao.maps.Size(45, 45); // 마커 이미지의 크기
var markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize);

// 지도를 클릭했을때 클릭한 위치에 마커를 추가하도록 지도에 클릭이벤트를 등록합니다
kakao.maps.event.addListener(map, 'click', function (mouseEvent) {
    // 클릭한 위치에 마커를 표시합니다 
    addMarker(mouseEvent.latLng);
});

// 지도에 표시된 마커 객체를 가지고 있을 배열입니다
var markers = [];
// 검색 기능 관련
var infowindow = new kakao.maps.InfoWindow({ zIndex: 1 });
var ps = new kakao.maps.services.Places();

// 마커 하나를 지도위에 표시합니다 
addMarker(new kakao.maps.LatLng(33.450701, 126.570667));

// 마커를 생성하고 지도위에 표시하는 함수입니다
function addMarker(position) {

    // 마커를 생성합니다
    var marker = new kakao.maps.Marker({
        position: position,
        image: markerImage
    });

    // 마커가 지도 위에 표시되도록 설정합니다
    marker.setMap(map);

    // 생성된 마커 클릭 시 마커를 제거
    kakao.maps.event.addListener(marker, 'click', function () {
        marker.setMap(null); // 마커를 지도에서 제거합
        // 배열에서 마커 제거
        markers = markers.filter(m => m !== marker);
    });

    // 생성된 마커를 배열에 추가합니다
    markers.push(marker);
}

// 배열에 추가된 마커들을 지도에 표시하거나 삭제하는 함수입니다
function setMarkers(map) {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(map);
    }
}

// "마커 보이기" 버튼을 클릭하면 호출되어 배열에 추가된 마커를 지도에 표시하는 함수입니다
function showMarkers() {
    setMarkers(map)
}

// "마커 감추기" 버튼을 클릭하면 호출되어 배열에 추가된 마커를 지도에서 삭제하는 함수입니다
function hideMarkers() {
    setMarkers(null);
}

// 검색 내용 저장할 배열
var searchMarkers = [];

// 엔터키 클릭이벤트 처리
function handleEnterKey(event) {
    if (event.key === 'Enter') {
        searchPlaces();
    }
}

function searchPlaces() {
    var keyword = document.getElementById('keyword').value;

    if (!keyword.trim()) {
        alert('검색어를 입력해주세요!');
        return;
    }

    // 검색 결과 목록 초기화
    document.getElementById('placesList').style.display = 'block'; // 목록 보이게 하기
    ps.keywordSearch(keyword, placesSearchCB);
}

function placesSearchCB(data, status, pagination) {
    // 이전에 생성된 마커를 제거
    removeSearchMarkers();

    // 검색 결과가 있으면 목록을 표시
    if (status === kakao.maps.services.Status.OK) {
        displayPlaces(data);

        // 검색된 장소에 번호 마커 추가
        for (var i = 0; i < data.length; i++) {
            displaySearchMarker(data[i], i + 1); // i + 1로 인덱스 값을 전달
        }
    } else if (status === kakao.maps.services.Status.ZERO_RESULT) {
        alert('검색 결과가 없습니다.');
    } else if (status === kakao.maps.services.Status.ERROR) {
        alert('검색 중 오류가 발생했습니다.');
    }
}

function displayPlaces(places) {
    var listEl = document.getElementById('placesList');
    listEl.innerHTML = '';
    removeSearchMarkers();

    for (var i = 0; i < places.length; i++) {
        var itemEl = document.createElement('div');
        itemEl.className = 'placeItem';
        itemEl.innerHTML = `
                    <span class="markerbg" style="background-position: 0 -${i * 46}px;"></span>
                    <div class="info">
                        <h5>${places[i].place_name}</h5>
                        <span class="gray">${places[i].road_address_name || places[i].address_name}</span><br>
                        <span class="tel">${places[i].phone || '전화번호 없음'}</span>
                    </div>
                `;

        itemEl.onclick = (function (place) {
            return function () {
                map.setCenter(new kakao.maps.LatLng(place.y, place.x));
                infowindow.setContent('<div style="padding:100px; ">' + place.place_name + '</div>');
                infowindow.open(map, new kakao.maps.Marker({
                    position: new kakao.maps.LatLng(place.y, place.x)
                }));
            };
        })(places[i]);

        listEl.appendChild(itemEl);
    }
}

function displaySearchMarker(place, index) {
    var marker = new kakao.maps.Marker({
        map: map,
        position: new kakao.maps.LatLng(place.y, place.x),
        image: new kakao.maps.MarkerImage(
            'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_number_blue.png',
            new kakao.maps.Size(45, 45),
            { spriteOrigin: new kakao.maps.Point(0, (index - 1) * 46), spriteSize: new kakao.maps.Size(36, 691) } // 수정된 부분
        )
    });

    // 마커 클릭 시 마커를 일반 마커로 교체하고 검색창을 초기화합니다.
    kakao.maps.event.addListener(marker, 'click', function () {
        document.getElementById('keyword').value = ''; // 검색창 초기화
        addMarker(marker.getPosition()); // 해당 위치에 일반 마커 표시
        marker.setMap(null); // 번호 마커는 지도에서 제거
        document.getElementById('placesList').style.display = 'none'; // 검색 결과 목록 숨기기
        infowindow.close(); // 상단의 정보창 닫기
        removeSearchMarkers();
    });

    searchMarkers.push(marker);
}

function removeSearchMarkers() {
    for (var i = 0; i < searchMarkers.length; i++) {
        searchMarkers[i].setMap(null);
    }
    searchMarkers = [];
}
