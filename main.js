// Diese Methode findet heraus, wie viel Quota wir zur Verfügung haben.
navigator.storage.estimate().then(
    ({ usage, quota }) => console.log(`Wird ${usage} Byte aus ${quota} Byte verwendet`),
    error => console.warn(`error estimating quota: ${error.name}: ${error.message}`)
);

// Quota anfordern.
if (navigator.storage && navigator.storage.persist)
    navigator.storage.persist().then(function(persistent) {
        if (persistent)
            console.log("Der Speicher wird nicht gelöscht, bei bedarf des Browsers gelöscht");
        else
            console.log("Die Speicherung kann unter Speicherdruck gelöscht werden.");
    });

// Auskomentieren wenn man die Quota anfordern möchte.
/* var requestedBytes = 1024 * 1024 * 280;
  navigator.webkitPersistentStorage.requestQuota(
    requestedBytes,
    function(grantedBytes) {
        console.log('we were granted ', grantedBytes, 'bytes');
    },
    function(e) { console.log('Error', e); }
); */

// Registrierung des Service Worker.
if ('serviceWorker' in navigator) {
    window.addEventListener("load", () => {

        navigator.serviceWorker
            .register('/sw.js', { scope: '/' })
            .then((reg) => {
                // Registrierung erfolgreich
                console.log('Registrierung erfolgreich. Scope ist ' + reg.scope);

            }).catch((error) => {
                // Registrierung fehlgeschlagen
                console.log('Registrierung fehlgeschlagen mit ' + error);
            });
    })
};

//Erstellung einer globalen Datenbankvariable.
let db;
// Drei Videos die wir anzeigen wollen.
let arrayOfData = [1, 2, 3];


// Diese Funktion öffnet eine Transaktion um die Videos in die Datenbank hinzufügen.
function addVideo(video) {
    // Definieren eines Objekts, welches wir dem Store hinzufügen wollen.
    let newVideo = {

            videoBlob: video,
        }
        // Anlegen einer Transaktion mit dem Parameter 'readwrite' für die Lese-Schreibe Berechtigung.
    let tx = db.transaction(["videos_store"], "readwrite");
    // Die Methode objectStore() wird verwendet, um ein Store zu erhalten, mit dem man weiter arbeiten kann.
    let objectStore = tx.objectStore("videos_store");
    objectStore.add(newVideo);
}

// Diese Funktion erstelt DOM-Elemente und fügt die Videos dort ein.
function display(videoBlob) {

    // Aus Binärdaten machen wir ein URL
    let videoUrl = URL.createObjectURL(videoBlob);

    const videoPlaceHolder = document.querySelector('.videoPlaceHolder');
    const video_wrapper = document.createElement('div');
    video_wrapper.className = "video-wrapper";
    const video = document.createElement('video');

    const videoSrc = document.createElement('source');
    videoSrc.src = videoUrl;
    videoSrc.type = 'video/mp4';

    console.log(videoSrc)

    const textinfo = document.createElement('div');
    textinfo.className = "text-info"

    videoPlaceHolder.insertAdjacentElement('afterbegin', video_wrapper);
    video_wrapper.insertAdjacentElement('afterbegin', video);
    video.insertAdjacentElement('afterbegin', videoSrc);
    video_wrapper.insertAdjacentElement('beforeend', textinfo);

    const para = document.createElement("p");
    textinfo.insertAdjacentElement('beforeend', para);
    para.textContent = 'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.';

    video.classList.add("myvideo");
    video.addEventListener("mouseenter", () => {
        video.setAttribute("controls", "controls")
    })
    video.addEventListener("mouseleave", () => {
        video.removeAttribute("controls")

    })
}

// Diese Funktion holt Videos aus dem Netz.
const getVideo = async function(url) {

    const response = await fetch(url);
    console.log(response);
    if (!response.ok) {
        throw new Error(`Fehler in der Adresse ${url}, Fehlercode: ${response.status}!`);
    }
    // Bekommen Daten in einer Binärform 
    let content = await response.blob()
    console.log(content);
    addVideo(content)
    display(content)
};

// Anfrage zum Öffnen einer Datenbank.
//Die open-Methode gibt ein IDBOpenDBRequest-Objekt zurück, welcher drei Event-Handlern besitzt: onsuccess, onupgradeneeded, onerror.

let request = window.indexedDB.open('videos_db', 1);

console.log(request);

// In onsuccess-Eventhandler weisen wir der Variablen db das Ergebnis einer Abfrage zur Erstellung einer Datenbank zu 
// und das Ergebnis der Abfrage ist die Datenbank selbst.

request.onsuccess = (e) => {

    db = e.target.result;
    console.log(db);

    // Schleife, bei der man alle Videos die im arrayOfData aufgezählt sind aus der Datenbank holt, 
    // wenn aber die Videos nicht in der Datenbank vorhanden sind, versuchen wir die aus dem Netz zu holen.
    for (let i = 0; i < arrayOfData.length; i++) {
        let tx = db.transaction('videos_store');
        let objectStore = tx.objectStore('videos_store');

        // Man versucht die Videos aus der Datenbank zu holen 

        let request = objectStore.get(arrayOfData[i]);

        request.onsuccess = () => {
            // Wenn die Videos nicht in dem Cache sind, dann hollen wir die aus dem Netz
            if (request.result == undefined) {
                console.log(arrayOfData[i]);
                getVideo(`/videos/${arrayOfData[i]}.mp4`);
            }
            // Wenn man aber in der Datenbank etwas hat, dann wird es zu der Funktion display übergeben und somit angezeigt.  
            if (request.result !== undefined) {
                console.log(request.result)
                display(request.result.videoBlob);
            }
        };
    }
}

// Nur in diesem Eventhandler können wir den Objektspeicher objectStore in der Datenbank anlegen.
request.onupgradeneeded = (e) => {
    db = e.target.result;
    // Erstellen eines Objektspeichers in der DB
    // Der erste Parameter ist der Speichername und der zweite besteht aus den Spaltenname, 
    // in den der Schlüssel geschrieben wird und optionalen Generierung des Schlüssels.
    db.createObjectStore("videos_store", { keyPath: "id", autoIncrement: true });
}

request.onerror = () => {
    console.log("Error");
}