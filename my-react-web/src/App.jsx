// src/App.jsx
import { useEffect, useState, useRef } from "react";
import { PERSONES } from "./data/persones";
import "./App.css";

export default function App() {
  const targetDate = new Date("2025-12-27T19:00:00");

  const calculateTimeLeft = () => {
    const now = new Date();
    const diff = targetDate - now;

    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0 };
    }

    const totalMinutes = Math.floor(diff / 1000 / 60);
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;

    return { days, hours, minutes };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
  const [selectedName, setSelectedName] = useState("");
  const [prevName, setPrevName] = useState("");
  const [discVisible, setDiscVisible] = useState(false);
  const [discKey, setDiscKey] = useState(0);
  const [loadedImages, setLoadedImages] = useState({});
  const audioRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => {
      clearInterval(timer);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Pre-cargar todas las imágenes al montar
  useEffect(() => {
    const entries = Object.entries(PERSONES);
    entries.forEach(([name, data]) => {
      const img = new Image();
      img.src = data.image;
      img.onload = () => {
        setLoadedImages((prev) => ({ ...prev, [name]: true }));
      };
    });
  }, []);

  const isFinished = targetDate - new Date() <= 0;
  const names = Object.keys(PERSONES);

  const handleSelect = (name) => {
    // stop previous audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    // trigger CD animation
    setDiscKey((k) => k + 1);
    setDiscVisible(true);

    // after animation ends, update bg + audio
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      // guarda la imagen anterior para poder hacer fade out
      setPrevName(selectedName);
      setSelectedName(name);

      const persona = PERSONES[name];
      if (audioRef.current && persona?.audio) {
        audioRef.current.src = persona.audio;
        audioRef.current
          .play()
          .catch(() => {
            // autoplay blocked → do nothing
          });
      }

      setDiscVisible(false);
    }, 1100); // slightly > animation duration
  };

  const getMessage = () => {
    if (!selectedName) {
      return 'Et deixem algun dels temes del nostre disc, selecciona les diferents pistes... 🎶';
    }
    return PERSONES[selectedName].message;
  };

  // Color per persona
  const accentColor = selectedName
    ? PERSONES[selectedName].color
    : "#38bdf8";
  const accentSoft = selectedName
    ? PERSONES[selectedName].colorSoft
    : "rgba(56, 189, 248, 0.35)";

  return (
    <div className="page">
      {/* BACKGROUND LAYER: base gradient + color by person + image */}
      <div className="bg-layer">
        <div className="bg-base" />
        <div
          className="bg-color-overlay"
          style={{ backgroundColor: accentSoft }}
        />

        {/* Imagen anterior con fade OUT */}
        {prevName &&
          prevName !== selectedName &&
          loadedImages[prevName] && (
            <div
              key={`prev-${prevName}`}
              className="bg-photo fade-out"
              style={{ backgroundImage: `url(${PERSONES[prevName].image})` }}
            />
          )}

        {/* Imagen nueva con fade IN */}
        {selectedName && loadedImages[selectedName] && (
          <div
            key={selectedName}
            className="bg-photo fade-in"
            style={{
              backgroundImage: `url(${PERSONES[selectedName].image})`,
            }}
          />
        )}
      </div>

      {/* CD ANIMATION LAYER */}
      <div className="cd-flying-layer">
        {discVisible && (
          <div
            key={discKey}
            className="cd-flying"
          />
        )}
      </div>

      {/* MAIN CONTENT */}
      <div className="content">
        <h1 className="title">Comiats 2025</h1>
        <p className="subtitle">
          Aquest disc sí que es mereix una &quot;listening party&quot;, i només
          queden:
        </p>

        <div className="countdown">
          <div className="time-box">
            <span className="number">{timeLeft.days}</span>
            <span className="label">dies</span>
          </div>
          <div className="time-box">
            <span className="number">{timeLeft.hours}</span>
            <span className="label">hores</span>
          </div>
          <div className="time-box">
            <span className="number">{timeLeft.minutes}</span>
            <span className="label">minuts</span>
          </div>
        </div>

        {isFinished && (
          <p className="finished">Ja ha arribat el moment! 🎉</p>
        )}

        <p className={`info-text ${selectedName ? "" : "muted"}`}>
          {getMessage()}
        </p>
      </div>

      {/* BOTTOM BUTTONS */}
      <div className="buttons">
        {names.map((name) => {
          const isActive = selectedName === name;
          const p = PERSONES[name];
          return (
            <button
              key={name}
              className={`btn ${isActive ? "active" : ""}`}
              onClick={() => handleSelect(name)}
              style={
                isActive
                  ? {
                      backgroundColor: p.colorSoft,
                      borderColor: p.color,
                    }
                  : undefined
              }
            >
              {name}
            </button>
          );
        })}
      </div>

      <audio ref={audioRef} />
    </div>
  );
}
