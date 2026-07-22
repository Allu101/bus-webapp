import React from 'react';

const COLORS = {
  bgHidden: '#101f33', // Piilotetun napin tausta
};

function LineFilterBar({ activeLines, hiddenLines, toggleLineVisibility, toggleAllLines, allLinesHidden }) {
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
            backgroundColor: allLinesHidden ? COLORS.bgHidden : '#3f6fe8',
            color: allLinesHidden ? '#8eb3ff' : '#ffffff',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 'bold',
            transition: 'all 0.15s ease',
            minWidth: '120px'
          }}
        >
          {allLinesHidden ? '👁️ Näytä kaikki' : '❌ Piilota kaikki'}
        </button>

        {/* Linjapainikkeet */}
        {activeLines.map((lineObj) => {
          const line = lineObj.name; 
          const isHidden = hiddenLines.has(line);

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
                backgroundColor: isHidden ? COLORS.bgHidden : mainColor,
                color: isHidden ? '#5f7b9f' : '#f8fbff', // Himmennetään teksti jos piilotettu
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                opacity: isHidden ? 0.4 : 1,
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