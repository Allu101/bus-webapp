import React from 'react';

const COLORS = {
  bgHidden: '#101f33', // Piilotetun napin tausta
};

function LineFilterBar({ activeLines, selectedLines, toggleLineVisibility, toggleAllLines }) {
  const someSelected = selectedLines.size > 0;

  return (
    <div style={{
      padding: '14px',
      background: '#161d27',
      borderBottom: '1px solid #24313f',
      zIndex: 1000,
      boxShadow: '0 3px 10px rgba(0,0,0,0.35)',
      maxHeight: '190px',
      overflowY: 'auto',
    }}>
      <h4 style={{ margin: '0 0 10px 0', color: '#f1f6ff', fontFamily: 'sans-serif' }}>
        Suodata linjoja (Klikkaa piilottaaksesi/näyttääksesi):
      </h4>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
        
        {/* "Näytä / Piilota kaikki" -painike */}
        <button
          onClick={toggleAllLines}
          style={{
            padding: '6px 14px',
            borderRadius: '20px',
            border: '1px solid #4f7dea',
            backgroundColor: someSelected ? '#3f6fe8' : COLORS.bgHidden,
            color: someSelected ? '#f8fbff' : '#5f7b9f',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 'bold',
            transition: 'all 0.15s ease',
            minWidth: '120px'
          }}
        >
          {/*allLinesHidden ? '👁️ Näytä kaikki' : '❌ Piilota kaikki'*/}
          {someSelected ? '👁️ Näytä kaikki' : '✅ Kaikki näkyvissä'}
        </button>

        {/* Linjapainikkeet */}
        {activeLines.map((lineObj) => {
          const line = lineObj.name; 
          const isSelected = selectedLines.has(line);
          const isActive = !someSelected || isSelected;

          const customColor = lineObj.route_color ? `#${lineObj.route_color.replace('#', '')}af` : '#0f4db5';
          const customBorderColor = lineObj.route_color ? `#${lineObj.route_color.replace('#', '')}` : '#0f4db5';

          const mainColor = customColor;
          const borderColor = customBorderColor;

          return (
            <button
              key={line}
              onClick={() => toggleLineVisibility(line)}
              style={{
                padding: '6px 12px',
                borderRadius: '15px',
                border: `2px solid ${borderColor}`,
                backgroundColor: isActive ? mainColor : COLORS.bgHidden,
                color: isActive ? '#f8fbff' : '#5f7b9f', // Himmennetään teksti jos piilotettu
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                opacity: isActive ? 1 : 0.4,
                transition: 'all 0.15s ease',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              <span>{line}</span>
            </button>
          );
        })}

        {activeLines.length === 0 && (
          <span style={{ fontSize: '13px', color: '#8eb3ff', fontFamily: 'sans-serif' }}>
            Ladataan linjalistaa...
          </span>
        )}
      </div>
    </div>
  );
}

export default LineFilterBar;