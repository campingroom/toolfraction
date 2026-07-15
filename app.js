// app.js - Logic for Fraction Visual Aid Generator
document.addEventListener('DOMContentLoaded', () => {
  
  // --- STATE VARIABLES ---
  let currentMode = 'wall'; // 'wall', 'single', 'grid', 'notebook', 'cutting'
  let zoomScale = 0.7;
  
  // Wall Mode State
  let wallRows = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  let wallShaded = {}; // rowIdx -> Set of colIdx
  
  // Single Shape Mode State
  let singleShapeType = 'circle';
  let singleDivisions = 4;
  let gridCols = 4;
  let gridRows = 3;
  let singleShaded = new Set();
  
  // Grid Mode (Multi Cards) State
  let cardShapeType = 'circle';
  let cardLayoutCols = 2;
  let cardLayoutRows = 3;
  let cardDivsType = 'same'; // 'same', 'sequence'
  let cardDivsVal = 6;
  let cardDivsSeqStart = 2;
  let cardDivsSeqStep = 1;
  let cardsShaded = {}; // cardIdx -> Set of colIdx

  // Cutting Mode State
  let cuttingRows = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  // Initializing shaded structures
  function initWallShaded() {
    wallShaded = {};
    wallRows.forEach((divs, r) => {
      wallShaded[r] = new Set();
    });
  }
  
  function initCardsShaded() {
    cardsShaded = {};
    const totalCards = cardLayoutCols * cardLayoutRows;
    for (let i = 0; i < totalCards; i++) {
      cardsShaded[i] = new Set();
    }
  }

  initWallShaded();
  initCardsShaded();

  function initCuttingRows() {
    cuttingRows = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  }

  // --- PALETTE DEFINITIONS ---
  const PALETTES = {
    pastel: ['#FFB7B2', '#FFDAC1', '#E2F0CB', '#B5EAD7', '#C7CEEA', '#FFC6FF', '#E8AEFF', '#BFFCC6', '#FFE5EC', '#D8F3DC'],
    rainbow: ['#FF8A80', '#FFD180', '#FFFF8D', '#CCFF90', '#A7FFEB', '#80D8FF', '#82B1FF', '#B388FF', '#F8BBD0', '#D1C4E9'],
    'cpare-green': ['#5B7B2E', '#7C9A4A', '#98B46C', '#B5CE8E', '#D2E8B0', '#EAF5D2', '#E2ECDE', '#C2D5A7'],
    'cpare-brown': ['#B5762A', '#D4924A', '#E3A867', '#F1BE85', '#FAD4A3', '#FDF0DC', '#EFE5D3', '#DCC8A7'],
    monochrome: ['#424242', '#616161', '#757575', '#9e9e9e', '#bdbdbd', '#e0e0e0', '#eeeeee', '#f5f5f5']
  };

  // --- DOM ELEMENTS ---
  const pageTitleInput = document.getElementById('page-title');
  const customInstructionInput = document.getElementById('custom-instruction');
  const showStudentInfoCheckbox = document.getElementById('show-student-info');
  const pageMarginSelect = document.getElementById('page-margin');
  const fillModeSelect = document.getElementById('fill-mode');
  const colorPaletteSelect = document.getElementById('color-palette');
  const customColorPickers = document.getElementById('custom-color-pickers');
  const colorFillPrimary = document.getElementById('color-fill-primary');
  const colorFillShaded = document.getElementById('color-fill-shaded');
  const shadingStyleSelect = document.getElementById('shading-style');
  const lineStyleSelect = document.getElementById('line-style');
  const lineThicknessSelect = document.getElementById('line-thickness');
  const lineColorInput = document.getElementById('line-color');
  const shapeSpacingSelect = document.getElementById('shape-spacing');
  const labelFormatSelect = document.getElementById('label-format');
  const labelShadedOnlyCheckbox = document.getElementById('label-shaded-only');
  const labelFontSizeSelect = document.getElementById('label-font-size');
  
  const singleShapeTypeSelect = document.getElementById('single-shape-type');
  const singleDivisionsSlider = document.getElementById('single-divisions');
  const singleDivValDisplay = document.getElementById('single-div-val');
  const gridDimensionsGroup = document.getElementById('grid-dimensions-group');
  const singleDivGroup = document.getElementById('single-div-group');
  const gridColsInput = document.getElementById('grid-cols');
  const gridRowsInput = document.getElementById('grid-rows');

  const cardShapeTypeSelect = document.getElementById('card-shape-type');
  const cardLayoutColsInput = document.getElementById('card-layout-cols');
  const cardLayoutRowsInput = document.getElementById('card-layout-rows');
  const cardDivsValSlider = document.getElementById('card-divs-val');
  const cardDivsValDisplay = document.getElementById('card-divs-val-display');
  const cardDivsSameValGroup = document.getElementById('card-divs-same-val-group');
  const cardDivsSeqStartGroup = document.getElementById('card-divs-seq-start-group');
  const cardDivsSeqStartInput = document.getElementById('card-divs-seq-start');
  const cardDivsSeqStepInput = document.getElementById('card-divs-seq-step');

  const showWorksheetHeaderCheckbox = document.getElementById('show-worksheet-header');
  const wallHeightSlider = document.getElementById('wall-height-slider');
  const wallHeightValDisplay = document.getElementById('wall-height-val');
  const notebookPatternSelect = document.getElementById('notebook-pattern');
  const notebookSpacingSelect = document.getElementById('notebook-spacing');
  const notebookRedMarginCheckbox = document.getElementById('notebook-red-margin');
  const notebookSettingsPanel = document.getElementById('settings-notebook');

  const renderPageTitle = document.getElementById('render-page-title');
  const renderPageInstruction = document.getElementById('render-page-instruction');
  const studentInfoRow = document.getElementById('student-info-row');
  const a4PrintPage = document.getElementById('a4-print-page');
  const worksheetContent = document.getElementById('worksheet-content');

  // --- RENDERING CONFIG & STYLING HELPERS ---
  
  function getLineDashArray() {
    const style = lineStyleSelect.value;
    if (style === 'dashed') return '6,4';
    if (style === 'dotted') return '2,4';
    return 'none';
  }

  function getLineThickness() {
    const thickness = lineThicknessSelect.value;
    if (thickness === 'thin') return '1px';
    if (thickness === 'medium') return '1.8px';
    if (thickness === 'thick') return '2.8px';
    if (thickness === 'xthick') return '4px';
    return '1.8px';
  }

  function getSvgDefsString() {
    return `
      <defs>
        <!-- Diagonal Hatch Pattern -->
        <pattern id="pattern-hatch-diagonal" width="12" height="12" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
          <line x1="6" y1="0" x2="6" y2="12" stroke="#2b2b26" stroke-width="1.8" />
        </pattern>
        <!-- Cross Hatch Pattern -->
        <pattern id="pattern-hatch-cross" width="12" height="12" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
          <line x1="6" y1="0" x2="6" y2="12" stroke="#2b2b26" stroke-width="1.8" />
          <line x1="0" y1="6" x2="12" y2="6" stroke="#2b2b26" stroke-width="1.8" />
        </pattern>
        <!-- Dots Pattern -->
        <pattern id="pattern-dots" width="10" height="10" patternUnits="userSpaceOnUse">
          <circle cx="5" cy="5" r="2.2" fill="#2b2b26" />
        </pattern>
      </defs>
    `;
  }

  function updatePrintOrientation() {
    const orient = document.querySelector('input[name="page-orientation"]:checked').value;
    let styleEl = document.getElementById('print-orientation-style');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'print-orientation-style';
      document.head.appendChild(styleEl);
    }
    styleEl.innerHTML = `@media print { @page { size: A4 ${orient} !important; margin: 0 !important; } }`;
  }

  function getBaseFillColor(paletteName, idx, total, isShaded) {
    const fillMode = fillModeSelect.value;
    const shadingStyle = shadingStyleSelect.value;

    // Outline Mode - strictly white or solid gray
    if (fillMode === 'outline') {
      if (isShaded && shadingStyle === 'solid') {
        return '#8a8a80'; // solid gray shading for outline mode
      }
      return '#ffffff';
    }

    // Resolve base palette color
    let baseColor = '#ffffff';
    if (paletteName === 'custom') {
      baseColor = colorFillPrimary.value;
    } else {
      const palette = PALETTES[paletteName] || PALETTES.pastel;
      baseColor = palette[idx % palette.length];
    }

    // Fully Colored Mode
    if (fillMode === 'colored') {
      return baseColor;
    }

    // Interactive Shaded Mode
    if (fillMode === 'interactive') {
      if (isShaded) {
        if (shadingStyle === 'solid') {
          if (paletteName === 'custom') {
            return colorFillShaded.value;
          }
          return baseColor;
        }
      }
      return '#ffffff'; // White for unshaded parts
    }

    return '#ffffff';
  }

  function getLabelText(idx, total) {
    const format = labelFormatSelect.value;
    if (format === 'blank') return '';
    if (format === 'fraction') return `1/${total}`;
    if (format === 'decimal') return (1 / total).toFixed(2).replace(/\.00$/, '');
    if (format === 'percent') return `${Math.round(100 / total)}%`;
    if (format === 'index') return `${idx + 1}`;
    return '';
  }

  // --- DRAWING FUNCTIONS (SVG GENERATORS) ---

  // 1. Render Fraction Wall
  function renderFractionWall() {
    const strokeWidth = getLineThickness();
    const strokeDash = getLineDashArray();
    const lineColor = lineColorInput.value;
    const palette = colorPaletteSelect.value;
    const labelFontSize = labelFontSizeSelect.value;
    const showOnlyShadedLabels = labelShadedOnlyCheckbox.checked;

    const isLandscape = document.querySelector('input[name="page-orientation"]:checked').value === 'landscape';
    const svgWidth = isLandscape ? 1100 : 800;
    const svgHeight = parseInt(wallHeightSlider.value) || (isLandscape ? 400 : 620);

    const spacingClass = shapeSpacingSelect.value;
    let gap = 0;
    if (spacingClass === 'small') gap = 4;
    if (spacingClass === 'medium') gap = 8;
    if (spacingClass === 'large') gap = 16;

    const totalGapsHeight = gap * (wallRows.length - 1);
    const remainingHeight = Math.max(100, svgHeight - totalGapsHeight);
    const rowHeight = remainingHeight / wallRows.length;

    let svgHtml = `<svg class="fraction-render-svg" viewBox="0 0 ${svgWidth} ${svgHeight}">`;
    svgHtml += getSvgDefsString();
    
    wallRows.forEach((divs, r) => {
      const y = r * (rowHeight + gap);
      const colWidth = svgWidth / divs;
      
      for (let c = 0; c < divs; c++) {
        const isShaded = wallShaded[r] && wallShaded[r].has(c);
        const fill = getBaseFillColor(palette, r, wallRows.length, isShaded);
        
        // Draw segment rect
        svgHtml += `
          <rect 
            class="svg-interactive-part" 
            x="${c * colWidth}" 
            y="${y}" 
            width="${colWidth}" 
            height="${rowHeight}" 
            fill="${fill}" 
            stroke="${lineColor}" 
            stroke-width="${strokeWidth}" 
            stroke-dasharray="${strokeDash}"
            data-row="${r}" 
            data-col="${c}" 
          />`;

        const fillMode = fillModeSelect.value;
        const shadingStyle = shadingStyleSelect.value;
        if (shadingStyle !== 'solid' && (isShaded || fillMode === 'colored')) {
          svgHtml += `
            <rect 
              class="svg-interactive-part" 
              x="${c * colWidth}" 
              y="${y}" 
              width="${colWidth}" 
              height="${rowHeight}" 
              fill="url(#pattern-${shadingStyle})" 
              stroke="none"
              data-row="${r}" 
              data-col="${c}" 
            />`;
        }

        // Draw label
        const labelText = getLabelText(c, divs);
        if (labelText && (!showOnlyShadedLabels || isShaded)) {
          const tx = (c + 0.5) * colWidth;
          const ty = y + rowHeight / 2;
          
          // Adjust display if cell is too small
          if (colWidth >= 28) {
            svgHtml += `
              <text 
                class="svg-label-text label-size-${labelFontSize}" 
                x="${tx}" 
                y="${ty}" 
                fill="#2b2b26">
                ${labelText}
              </text>`;
          }
        }
      }
    });

    svgHtml += `</svg>`;
    worksheetContent.innerHTML = `<div class="wall-svg-container" style="height: 90%; width: 100%;">${svgHtml}</div>`;
  }

  // 2. Render Single Shape
  function renderSingleShape() {
    const strokeWidth = getLineThickness();
    const strokeDash = getLineDashArray();
    const lineColor = lineColorInput.value;
    const palette = colorPaletteSelect.value;
    const labelFontSize = labelFontSizeSelect.value;
    const showOnlyShadedLabels = labelShadedOnlyCheckbox.checked;

    const isLandscape = document.querySelector('input[name="page-orientation"]:checked').value === 'landscape';
    const svgWidth = isLandscape ? 800 : 500;
    const svgHeight = isLandscape ? 400 : 500;

    let svgHtml = `<svg class="fraction-render-svg" viewBox="0 0 ${svgWidth} ${svgHeight}">`;
    svgHtml += getSvgDefsString();

    const fillMode = fillModeSelect.value;
    const shadingStyle = shadingStyleSelect.value;

    if (singleShapeType === 'circle') {
      const cx = isLandscape ? 400 : 250;
      const cy = isLandscape ? 200 : 250;
      const r = isLandscape ? 185 : 210;
      const divs = singleDivisions;
      
      if (divs === 1) {
        const isShaded = singleShaded.has(0);
        const fill = getBaseFillColor(palette, 0, 1, isShaded);
        svgHtml += `
          <circle 
            class="svg-interactive-part" 
            cx="${cx}" 
            cy="${cy}" 
            r="${r}" 
            fill="${fill}" 
            stroke="${lineColor}" 
            stroke-width="${strokeWidth}" 
            stroke-dasharray="${strokeDash}" 
            data-idx="0" 
          />`;

        if (shadingStyle !== 'solid' && (isShaded || fillMode === 'colored')) {
          svgHtml += `
            <circle 
              class="svg-interactive-part" 
              cx="${cx}" 
              cy="${cy}" 
              r="${r}" 
              fill="url(#pattern-${shadingStyle})" 
              stroke="none" 
              data-idx="0" 
            />`;
        }
        
        const labelText = getLabelText(0, 1);
        if (labelText && (!showOnlyShadedLabels || isShaded)) {
          svgHtml += `<text class="svg-label-text label-size-${labelFontSize}" x="${cx}" y="${cy}">${labelText}</text>`;
        }
      } else {
        const angleStep = (2 * Math.PI) / divs;
        
        for (let i = 0; i < divs; i++) {
          const isShaded = singleShaded.has(i);
          const fill = getBaseFillColor(palette, i, divs, isShaded);
          
          // Math coordinates starting from 12 o'clock position (subtract PI/2)
          const angle1 = i * angleStep - Math.PI / 2;
          const angle2 = (i + 1) * angleStep - Math.PI / 2;
          
          const x1 = cx + r * Math.cos(angle1);
          const y1 = cy + r * Math.sin(angle1);
          const x2 = cx + r * Math.cos(angle2);
          const y2 = cy + r * Math.sin(angle2);
          
          // Arc path definition
          const pathD = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`;
          
          svgHtml += `
            <path 
              class="svg-interactive-part" 
              d="${pathD}" 
              fill="${fill}" 
              stroke="${lineColor}" 
              stroke-width="${strokeWidth}" 
              stroke-dasharray="${strokeDash}" 
              data-idx="${i}" 
            />`;

          if (shadingStyle !== 'solid' && (isShaded || fillMode === 'colored')) {
            svgHtml += `
              <path 
                class="svg-interactive-part" 
                d="${pathD}" 
                fill="url(#pattern-${shadingStyle})" 
                stroke="none" 
                data-idx="${i}" 
              />`;
          }
          
          // Draw label in the middle of sector
          const labelText = getLabelText(i, divs);
          if (labelText && (!showOnlyShadedLabels || isShaded)) {
            const midAngle = (angle1 + angle2) / 2;
            const tx = cx + (r * 0.65) * Math.cos(midAngle);
            const ty = cy + (r * 0.65) * Math.sin(midAngle);
            
            svgHtml += `
              <text 
                class="svg-label-text label-size-${labelFontSize}" 
                x="${tx}" 
                y="${ty}">
                ${labelText}
              </text>`;
          }
        }
      }
    } 
    else if (singleShapeType === 'strip') {
      const divs = singleDivisions;
      const x = isLandscape ? 50 : 20;
      const y = isLandscape ? 100 : 160;
      const w = isLandscape ? 700 : 460;
      const h = isLandscape ? 200 : 180;
      const colWidth = w / divs;
      
      for (let i = 0; i < divs; i++) {
        const isShaded = singleShaded.has(i);
        const fill = getBaseFillColor(palette, i, divs, isShaded);
        
        svgHtml += `
          <rect 
            class="svg-interactive-part" 
            x="${x + i * colWidth}" 
            y="${y}" 
            width="${colWidth}" 
            height="${h}" 
            fill="${fill}" 
            stroke="${lineColor}" 
            stroke-width="${strokeWidth}" 
            stroke-dasharray="${strokeDash}" 
            data-idx="${i}" 
          />`;

        if (shadingStyle !== 'solid' && (isShaded || fillMode === 'colored')) {
          svgHtml += `
            <rect 
              class="svg-interactive-part" 
              x="${x + i * colWidth}" 
              y="${y}" 
              width="${colWidth}" 
              height="${h}" 
              fill="url(#pattern-${shadingStyle})" 
              stroke="none" 
              data-idx="${i}" 
            />`;
        }
        
        const labelText = getLabelText(i, divs);
        if (labelText && (!showOnlyShadedLabels || isShaded)) {
          const tx = x + (i + 0.5) * colWidth;
          const ty = y + h / 2;
          
          if (colWidth >= 28) {
            svgHtml += `
              <text 
                class="svg-label-text label-size-${labelFontSize}" 
                x="${tx}" 
                y="${ty}">
                ${labelText}
              </text>`;
          }
        }
      }
    } 
    else if (singleShapeType === 'square') {
      const divs = singleDivisions;
      const x = isLandscape ? 230 : 50;
      const y = isLandscape ? 30 : 50;
      const size = isLandscape ? 340 : 400;
      const colWidth = size / divs;
      
      for (let i = 0; i < divs; i++) {
        const isShaded = singleShaded.has(i);
        const fill = getBaseFillColor(palette, i, divs, isShaded);
        
        svgHtml += `
          <rect 
            class="svg-interactive-part" 
            x="${x + i * colWidth}" 
            y="${y}" 
            width="${colWidth}" 
            height="${size}" 
            fill="${fill}" 
            stroke="${lineColor}" 
            stroke-width="${strokeWidth}" 
            stroke-dasharray="${strokeDash}" 
            data-idx="${i}" 
          />`;

        if (shadingStyle !== 'solid' && (isShaded || fillMode === 'colored')) {
          svgHtml += `
            <rect 
              class="svg-interactive-part" 
              x="${x + i * colWidth}" 
              y="${y}" 
              width="${colWidth}" 
              height="${size}" 
              fill="url(#pattern-${shadingStyle})" 
              stroke="none" 
              data-idx="${i}" 
            />`;
        }
        
        const labelText = getLabelText(i, divs);
        if (labelText && (!showOnlyShadedLabels || isShaded)) {
          const tx = x + (i + 0.5) * colWidth;
          const ty = y + size / 2;
          
          if (colWidth >= 28) {
            svgHtml += `
              <text 
                class="svg-label-text label-size-${labelFontSize}" 
                x="${tx}" 
                y="${ty}">
                ${labelText}
              </text>`;
          }
        }
      }
    } 
    else if (singleShapeType === 'grid') {
      const cols = gridCols;
      const rows = gridRows;
      const total = cols * rows;
      
      const x = isLandscape ? 100 : 50;
      const y = isLandscape ? 50 : 80;
      const w = isLandscape ? 600 : 400;
      const h = isLandscape ? 300 : 340;
      const colWidth = w / cols;
      const rowHeight = h / rows;
      
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c;
          const isShaded = singleShaded.has(idx);
          const fill = getBaseFillColor(palette, idx, total, isShaded);
          
          svgHtml += `
            <rect 
              class="svg-interactive-part" 
              x="${x + c * colWidth}" 
              y="${y + r * rowHeight}" 
              width="${colWidth}" 
              height="${rowHeight}" 
              fill="${fill}" 
              stroke="${lineColor}" 
              stroke-width="${strokeWidth}" 
              stroke-dasharray="${strokeDash}" 
              data-idx="${idx}" 
            />`;

          if (shadingStyle !== 'solid' && (isShaded || fillMode === 'colored')) {
            svgHtml += `
              <rect 
                class="svg-interactive-part" 
                x="${x + c * colWidth}" 
                y="${y + r * rowHeight}" 
                width="${colWidth}" 
                height="${rowHeight}" 
                fill="url(#pattern-${shadingStyle})" 
                stroke="none" 
                data-idx="${idx}" 
              />`;
          }
          
          const labelText = getLabelText(idx, total);
          if (labelText && (!showOnlyShadedLabels || isShaded)) {
            const tx = x + (c + 0.5) * colWidth;
            const ty = y + (r + 0.5) * rowHeight;
            
            svgHtml += `
              <text 
                class="svg-label-text label-size-${labelFontSize}" 
                x="${tx}" 
                y="${ty}">
                ${labelText}
              </text>`;
          }
        }
      }
    }

    svgHtml += `</svg>`;
    worksheetContent.innerHTML = `<div class="single-shape-container">${svgHtml}</div>`;
  }

  // Helper for drawing shapes inside cutout cards
  function drawShapeString(shape, divs, cardIdx) {
    const strokeWidth = getLineThickness();
    const strokeDash = getLineDashArray();
    const lineColor = lineColorInput.value;
    const palette = colorPaletteSelect.value;
    const labelFontSize = labelFontSizeSelect.value;
    const showOnlyShadedLabels = labelShadedOnlyCheckbox.checked;

    const preserveAR = (shape === 'full-strip') ? 'none' : 'xMidYMid meet';
    let svgHtml = `<svg class="fraction-render-svg" viewBox="0 0 200 200" preserveAspectRatio="${preserveAR}">`;
    svgHtml += getSvgDefsString();
    const cx = 100, cy = 100;
    const cardShadedSet = cardsShaded[cardIdx] || new Set();

    const fillMode = fillModeSelect.value;
    const shadingStyle = shadingStyleSelect.value;

    if (shape === 'circle') {
      const r = 80;
      if (divs === 1) {
        const isShaded = cardShadedSet.has(0);
        const fill = getBaseFillColor(palette, 0, 1, isShaded);
        svgHtml += `
          <circle 
            class="svg-interactive-part" 
            cx="${cx}" 
            cy="${cy}" 
            r="${r}" 
            fill="${fill}" 
            stroke="${lineColor}" 
            stroke-width="${strokeWidth}" 
            stroke-dasharray="${strokeDash}" 
            data-card="${cardIdx}" 
            data-idx="0" 
          />`;

        if (shadingStyle !== 'solid' && (isShaded || fillMode === 'colored')) {
          svgHtml += `
            <circle 
              class="svg-interactive-part" 
              cx="${cx}" 
              cy="${cy}" 
              r="${r}" 
              fill="url(#pattern-${shadingStyle})" 
              stroke="none" 
              data-card="${cardIdx}" 
              data-idx="0" 
            />`;
        }
        
        const labelText = getLabelText(0, 1);
        if (labelText && (!showOnlyShadedLabels || isShaded)) {
          svgHtml += `<text class="svg-label-text label-size-${labelFontSize}" x="${cx}" y="${cy}">${labelText}</text>`;
        }
      } else {
        const angleStep = (2 * Math.PI) / divs;
        
        for (let i = 0; i < divs; i++) {
          const isShaded = cardShadedSet.has(i);
          const fill = getBaseFillColor(palette, i, divs, isShaded);
          
          const angle1 = i * angleStep - Math.PI / 2;
          const angle2 = (i + 1) * angleStep - Math.PI / 2;
          
          const x1 = cx + r * Math.cos(angle1);
          const y1 = cy + r * Math.sin(angle1);
          const x2 = cx + r * Math.cos(angle2);
          const y2 = cy + r * Math.sin(angle2);
          
          const pathD = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`;
          
          svgHtml += `
            <path 
              class="svg-interactive-part" 
              d="${pathD}" 
              fill="${fill}" 
              stroke="${lineColor}" 
              stroke-width="${strokeWidth}" 
              stroke-dasharray="${strokeDash}" 
              data-card="${cardIdx}" 
              data-idx="${i}" 
            />`;

          if (shadingStyle !== 'solid' && (isShaded || fillMode === 'colored')) {
            svgHtml += `
              <path 
                class="svg-interactive-part" 
                d="${pathD}" 
                fill="url(#pattern-${shadingStyle})" 
                stroke="none" 
                data-card="${cardIdx}" 
                data-idx="${i}" 
              />`;
          }
          
          const labelText = getLabelText(i, divs);
          if (labelText && (!showOnlyShadedLabels || isShaded)) {
            const midAngle = (angle1 + angle2) / 2;
            const tx = cx + (r * 0.65) * Math.cos(midAngle);
            const ty = cy + (r * 0.65) * Math.sin(midAngle);
            
            svgHtml += `
              <text 
                class="svg-label-text label-size-${labelFontSize}" 
                x="${tx}" 
                y="${ty}" 
                font-size="10px">
                ${labelText}
              </text>`;
          }
        }
      }
    } 
    else if (shape === 'square') {
      const x = 20, y = 20, size = 160;
      const colWidth = size / divs;
      
      for (let i = 0; i < divs; i++) {
        const isShaded = cardShadedSet.has(i);
        const fill = getBaseFillColor(palette, i, divs, isShaded);
        
        svgHtml += `
          <rect 
            class="svg-interactive-part" 
            x="${x + i * colWidth}" 
            y="${y}" 
            width="${colWidth}" 
            height="${size}" 
            fill="${fill}" 
            stroke="${lineColor}" 
            stroke-width="${strokeWidth}" 
            stroke-dasharray="${strokeDash}" 
            data-card="${cardIdx}" 
            data-idx="${i}" 
          />`;

        if (shadingStyle !== 'solid' && (isShaded || fillMode === 'colored')) {
          svgHtml += `
            <rect 
              class="svg-interactive-part" 
              x="${x + i * colWidth}" 
              y="${y}" 
              width="${colWidth}" 
              height="${size}" 
              fill="url(#pattern-${shadingStyle})" 
              stroke="none" 
              data-card="${cardIdx}" 
              data-idx="${i}" 
            />`;
        }
        
        const labelText = getLabelText(i, divs);
        if (labelText && (!showOnlyShadedLabels || isShaded)) {
          const tx = x + (i + 0.5) * colWidth;
          const ty = y + size / 2;
          
          if (colWidth >= 16) {
            svgHtml += `
              <text 
                class="svg-label-text label-size-${labelFontSize}" 
                x="${tx}" 
                y="${ty}" 
                font-size="10px">
                ${labelText}
              </text>`;
          }
        }
      }
    } 
    else if (shape === 'strip') {
      const x = 10, y = 50, w = 180, h = 100;
      const colWidth = w / divs;
      
      for (let i = 0; i < divs; i++) {
        const isShaded = cardShadedSet.has(i);
        const fill = getBaseFillColor(palette, i, divs, isShaded);
        
        svgHtml += `
          <rect 
            class="svg-interactive-part" 
            x="${x + i * colWidth}" 
            y="${y}" 
            width="${colWidth}" 
            height="${h}" 
            fill="${fill}" 
            stroke="${lineColor}" 
            stroke-width="${strokeWidth}" 
            stroke-dasharray="${strokeDash}" 
            data-card="${cardIdx}" 
            data-idx="${i}" 
          />`;

        if (shadingStyle !== 'solid' && (isShaded || fillMode === 'colored')) {
          svgHtml += `
            <rect 
              class="svg-interactive-part" 
              x="${x + i * colWidth}" 
              y="${y}" 
              width="${colWidth}" 
              height="${h}" 
              fill="url(#pattern-${shadingStyle})" 
              stroke="none" 
              data-card="${cardIdx}" 
              data-idx="${i}" 
            />`;
        }
        
        const labelText = getLabelText(i, divs);
        if (labelText && (!showOnlyShadedLabels || isShaded)) {
          const tx = x + (i + 0.5) * colWidth;
          const ty = y + h / 2;
          
          if (colWidth >= 16) {
            svgHtml += `
              <text 
                class="svg-label-text label-size-${labelFontSize}" 
                x="${tx}" 
                y="${ty}" 
                font-size="10px">
                ${labelText}
              </text>`;
          }
        }
      }
    }
    else if (shape === 'full-strip') {
      const w = 200, h = 200;
      const colWidth = w / divs;
      
      for (let i = 0; i < divs; i++) {
        const isShaded = cardShadedSet.has(i);
        const fill = getBaseFillColor(palette, i, divs, isShaded);
        
        svgHtml += `
          <rect 
            class="svg-interactive-part" 
            x="${i * colWidth}" 
            y="0" 
            width="${colWidth}" 
            height="${h}" 
            fill="${fill}" 
            stroke="none" 
            data-card="${cardIdx}" 
            data-idx="${i}" 
          />`;

        if (shadingStyle !== 'solid' && (isShaded || fillMode === 'colored')) {
          svgHtml += `
            <rect 
              class="svg-interactive-part" 
              x="${i * colWidth}" 
              y="0" 
              width="${colWidth}" 
              height="${h}" 
              fill="url(#pattern-${shadingStyle})" 
              stroke="none" 
              data-card="${cardIdx}" 
              data-idx="${i}" 
            />`;
        }
      }

      // Draw the solid outer border of the card
      svgHtml += `
        <rect 
          x="0" 
          y="0" 
          width="${w}" 
          height="${h}" 
          fill="none" 
          stroke="${lineColor}" 
          stroke-width="${strokeWidth}" 
        />`;

      // Vertical division lines are dashed (stroke-dasharray="6,4")
      for (let i = 1; i < divs; i++) {
        const lx = i * colWidth;
        svgHtml += `
          <line 
            x1="${lx}" 
            y1="0" 
            x2="${lx}" 
            y2="${h}" 
            stroke="${lineColor}" 
            stroke-width="${strokeWidth}" 
            stroke-dasharray="6,4" 
          />`;
      }
      
      // Draw labels
      for (let i = 0; i < divs; i++) {
        const isShaded = cardShadedSet.has(i);
        const labelText = getLabelText(i, divs);
        if (labelText && (!showOnlyShadedLabels || isShaded)) {
          const tx = (i + 0.5) * colWidth;
          const ty = h / 2;
          
          if (colWidth >= 16) {
            svgHtml += `
              <text 
                class="svg-label-text label-size-${labelFontSize}" 
                x="${tx}" 
                y="${ty}" 
                font-size="12px">
                ${labelText}
              </text>`;
          }
        }
      }
    }

    svgHtml += `</svg>`;
    return svgHtml;
  }

  // 3. Render Cards Grid (Multi shapes layout)
  function renderCardsGrid() {
    const totalCards = cardLayoutCols * cardLayoutRows;
    const spacingClass = shapeSpacingSelect.value;
    
    let gapStyle = '15px';
    if (spacingClass === 'none') gapStyle = '0px';
    if (spacingClass === 'small') gapStyle = '8px';
    if (spacingClass === 'medium') gapStyle = '16px';
    if (spacingClass === 'large') gapStyle = '32px';

    const isSpacingNone = spacingClass === 'none';
    let gridHtml = `
      <div 
        class="cards-grid-container ${isSpacingNone ? 'spacing-none' : ''}" 
        style="grid-template-columns: repeat(${cardLayoutCols}, 1fr); grid-template-rows: repeat(${cardLayoutRows}, 1fr); gap: ${gapStyle}; width: 100%; height: 95%;">`;

    for (let i = 0; i < totalCards; i++) {
      let divs = cardDivsVal;
      
      if (cardDivsType === 'sequence') {
        divs = cardDivsSeqStart + i * cardDivsSeqStep;
      }
      
      const svgContent = drawShapeString(cardShapeType, divs, i);
      const isFullStrip = cardShapeType === 'full-strip';
      const isLabelBlank = labelFormatSelect.value === 'blank';
      const showCardLabel = !isFullStrip && !isLabelBlank;
      
      const cardLabelText = `รูปทรงแบ่งเป็น ${divs} ส่วนเท่าๆ กัน`;

      gridHtml += `
        <div class="card-item-box ${!showCardLabel ? 'no-label' : ''}">
          ${svgContent}
          ${showCardLabel ? `<div class="card-item-label font-mali">${cardLabelText}</div>` : ''}
        </div>`;
    }

    gridHtml += `</div>`;
    worksheetContent.innerHTML = gridHtml;
  }

  // 4. Render Notebook Templates
  function renderNotebook() {
    const strokeWidth = getLineThickness();
    const strokeDash = getLineDashArray();
    const lineColor = lineColorInput.value;
    
    const isLandscape = document.querySelector('input[name="page-orientation"]:checked').value === 'landscape';
    const svgWidth = isLandscape ? 1130 : 800;
    const svgHeight = isLandscape ? 800 : 1130;
    const mmToPx = isLandscape ? (1130 / 297) : (800 / 210);

    const pattern = notebookPatternSelect.value;
    const spacingVal = parseFloat(notebookSpacingSelect.value);
    const showRedMargin = notebookRedMarginCheckbox.checked;

    let svgHtml = `<svg class="fraction-render-svg" viewBox="0 0 ${svgWidth} ${svgHeight}" style="width: 100%; height: 100%;">`;
    
    if (pattern === 'lined') {
      const startY = 35 * mmToPx;
      const endY = svgHeight - 15 * mmToPx;
      const spacingPx = spacingVal * mmToPx;
      for (let y = startY; y <= endY; y += spacingPx) {
        svgHtml += `<line x1="15" y1="${y}" x2="${svgWidth - 15}" y2="${y}" stroke="${lineColor}" stroke-width="${strokeWidth}" stroke-dasharray="${strokeDash}" />`;
      }
      if (showRedMargin) {
        const marginX = 30 * mmToPx;
        svgHtml += `<line x1="${marginX}" y1="0" x2="${marginX}" y2="${svgHeight}" stroke="#ff6b6b" stroke-width="1.8" />`;
      }
    } 
    else if (pattern === 'grid') {
      const spacingPx = spacingVal * mmToPx;
      for (let x = 15; x <= svgWidth - 15; x += spacingPx) {
        svgHtml += `<line x1="${x}" y1="15" x2="${x}" y2="${svgHeight - 15}" stroke="${lineColor}" stroke-width="${strokeWidth}" stroke-dasharray="${strokeDash}" />`;
      }
      for (let y = 15; y <= svgHeight - 15; y += spacingPx) {
        svgHtml += `<line x1="15" y1="${y}" x2="${svgWidth - 15}" y2="${y}" stroke="${lineColor}" stroke-width="${strokeWidth}" stroke-dasharray="${strokeDash}" />`;
      }
    } 
    else if (pattern === 'dot') {
      const spacingPx = spacingVal * mmToPx;
      const dotRadius = lineThicknessSelect.value === 'thin' ? 1.2 : (lineThicknessSelect.value === 'medium' ? 1.8 : 2.5);
      for (let x = 15; x <= svgWidth - 15; x += spacingPx) {
        for (let y = 15; y <= svgHeight - 15; y += spacingPx) {
          svgHtml += `<circle cx="${x}" cy="${y}" r="${dotRadius}" fill="${lineColor}" />`;
        }
      }
    } 
    else if (pattern === 'music') {
      const lineSpacingPx = 2.5 * mmToPx;
      const staveGapPx = 18 * mmToPx;
      const staveHeight = 4 * lineSpacingPx;
      
      const startY = 35 * mmToPx;
      const endY = svgHeight - 20 * mmToPx;
      
      for (let y = startY; y + staveHeight <= endY; y += staveHeight + staveGapPx) {
        for (let l = 0; l < 5; l++) {
          const ly = y + l * lineSpacingPx;
          svgHtml += `<line x1="20" y1="${ly}" x2="${svgWidth - 20}" y2="${ly}" stroke="${lineColor}" stroke-width="${strokeWidth}" stroke-dasharray="${strokeDash}" />`;
        }
      }
    } 
    else if (pattern === 'iso') {
      const dx = spacingVal * mmToPx;
      const slope = 0.577350269;
      const stepY = dx * Math.sqrt(3);

      // Vertical lines
      for (let x = 15; x <= svgWidth - 15; x += dx) {
        svgHtml += `<line x1="${x}" y1="15" x2="${x}" y2="${svgHeight - 15}" stroke="${lineColor}" stroke-width="${strokeWidth}" stroke-dasharray="${strokeDash}" />`;
      }
      
      // Diagonal lines pointing down-right (30 degrees)
      for (let c = -svgWidth * slope; c < svgHeight; c += stepY) {
        const y1 = c;
        svgHtml += `<line x1="15" y1="${Math.max(15, slope * 15 + c)}" x2="${svgWidth - 15}" y2="${Math.min(svgHeight - 15, slope * (svgWidth - 15) + c)}" stroke="${lineColor}" stroke-width="${strokeWidth}" stroke-dasharray="${strokeDash}" />`;
      }
      
      // Diagonal lines pointing up-right (150 degrees)
      for (let c = 0; c < svgHeight + svgWidth * slope; c += stepY) {
        svgHtml += `<line x1="15" y1="${Math.max(15, -slope * 15 + c)}" x2="${svgWidth - 15}" y2="${Math.min(svgHeight - 15, -slope * (svgWidth - 15) + c)}" stroke="${lineColor}" stroke-width="${strokeWidth}" stroke-dasharray="${strokeDash}" />`;
      }
    }
    
    svgHtml += `</svg>`;
    worksheetContent.innerHTML = `<div class="wall-svg-container" style="height: 100%; width: 100%;">${svgHtml}</div>`;
  }

  // 5. Render Cutting Wall (full-page A4 borderless fraction wall)
  function renderCuttingWall() {
    const lineColor = lineColorInput.value;
    const strokeWidth = getLineThickness();

    const isLandscape = document.querySelector('input[name="page-orientation"]:checked').value === 'landscape';
    const svgWidth = isLandscape ? 1130 : 800;
    const svgHeight = isLandscape ? 800 : 1130;

    const totalRows = cuttingRows.length;
    const rowHeight = svgHeight / totalRows;

    let svgHtml = `<svg class="fraction-render-svg" viewBox="0 0 ${svgWidth} ${svgHeight}" preserveAspectRatio="none" style="width:100%;height:100%;">`;
    svgHtml += getSvgDefsString();

    for (let r = 0; r < totalRows; r++) {
      const divs = cuttingRows[r];
      const y = r * rowHeight;
      const colWidth = svgWidth / divs;

      // Draw cell backgrounds (white)
      for (let c = 0; c < divs; c++) {
        svgHtml += `<rect x="${c * colWidth}" y="${y}" width="${colWidth}" height="${rowHeight}" fill="white" stroke="none" />`;
      }

      // Draw dashed vertical division lines inside this row
      for (let c = 1; c < divs; c++) {
        const lx = c * colWidth;
        svgHtml += `<line x1="${lx}" y1="${y}" x2="${lx}" y2="${y + rowHeight}" stroke="${lineColor}" stroke-width="${strokeWidth}" stroke-dasharray="8,5" />`;
      }
    }

    // Draw solid horizontal lines between rows
    for (let r = 1; r < totalRows; r++) {
      const ly = r * rowHeight;
      svgHtml += `<line x1="0" y1="${ly}" x2="${svgWidth}" y2="${ly}" stroke="${lineColor}" stroke-width="${parseFloat(strokeWidth) + 0.5}px" />`;
    }

    // Draw outer border
    svgHtml += `<rect x="0" y="0" width="${svgWidth}" height="${svgHeight}" fill="none" stroke="${lineColor}" stroke-width="${parseFloat(strokeWidth) + 0.5}px" />`;

    svgHtml += `</svg>`;
    worksheetContent.innerHTML = `<div class="wall-svg-container" style="height: 100%; width: 100%;">${svgHtml}</div>`;
  }

  // Cutting Rows UI Management
  function updateCuttingRowsUI() {
    const listEl = document.getElementById('cutting-rows-list');
    if (!listEl) return;
    listEl.innerHTML = '';

    cuttingRows.forEach((divs, idx) => {
      const li = document.createElement('li');
      li.className = 'wall-row-item';
      li.innerHTML = `
        <span class="row-label">แถว ${idx + 1}</span>
        <input type="range" min="1" max="24" value="${divs}" class="cutting-row-slider" data-idx="${idx}">
        <span class="value-display cutting-row-val">${divs}</span>
        <button class="btn-icon-sm btn-remove-cutting-row" data-idx="${idx}" title="ลบแถว"><i class="fa-solid fa-trash-can"></i></button>
      `;
      listEl.appendChild(li);
    });

    // Bind slider & delete events
    listEl.querySelectorAll('.cutting-row-slider').forEach(slider => {
      slider.addEventListener('input', (e) => {
        const idx = parseInt(e.target.getAttribute('data-idx'));
        cuttingRows[idx] = parseInt(e.target.value);
        e.target.nextElementSibling.textContent = e.target.value;
        renderWorkspace();
      });
    });

    listEl.querySelectorAll('.btn-remove-cutting-row').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.getAttribute('data-idx'));
        if (cuttingRows.length <= 1) return;
        cuttingRows.splice(idx, 1);
        updateCuttingRowsUI();
        renderWorkspace();
      });
    });
  }

  // Cutting mode button events
  document.getElementById('btn-add-cutting-row').addEventListener('click', () => {
    const newDivs = cuttingRows.length > 0 ? cuttingRows[cuttingRows.length - 1] + 1 : 2;
    cuttingRows.push(Math.min(newDivs, 24));
    updateCuttingRowsUI();
    renderWorkspace();
  });

  document.getElementById('btn-cutting-reset').addEventListener('click', () => {
    initCuttingRows();
    updateCuttingRowsUI();
    renderWorkspace();
  });


  // --- INTERACTIVE SHADING SYSTEM (CLICK HANDLING) ---
  
  worksheetContent.addEventListener('click', (e) => {
    const part = e.target.closest('.svg-interactive-part');
    if (!part || fillModeSelect.value === 'colored') return;

    if (currentMode === 'wall') {
      const row = parseInt(part.getAttribute('data-row'));
      const col = parseInt(part.getAttribute('data-col'));
      
      if (!wallShaded[row]) wallShaded[row] = new Set();
      if (wallShaded[row].has(col)) {
        wallShaded[row].delete(col);
      } else {
        wallShaded[row].add(col);
      }
      renderFractionWall();
    } 
    else if (currentMode === 'single') {
      const idx = parseInt(part.getAttribute('data-idx'));
      
      if (singleShaded.has(idx)) {
        singleShaded.delete(idx);
      } else {
        singleShaded.add(idx);
      }
      renderSingleShape();
    } 
    else if (currentMode === 'grid') {
      const card = parseInt(part.getAttribute('data-card'));
      const idx = parseInt(part.getAttribute('data-idx'));
      
      if (!cardsShaded[card]) cardsShaded[card] = new Set();
      if (cardsShaded[card].has(idx)) {
        cardsShaded[card].delete(idx);
      } else {
        cardsShaded[card].add(idx);
      }
      renderCardsGrid();
    }
  });

  // --- CORE RENDER COORDINATOR ---
  function renderWorkspace() {
    // 1. Update text fields and toggle worksheet header visibility
    renderPageTitle.textContent = pageTitleInput.value;
    renderPageInstruction.textContent = customInstructionInput.value || ' ';
    
    const headerBlock = document.querySelector('.worksheet-header');
    if (headerBlock) {
      if (showWorksheetHeaderCheckbox.checked) {
        headerBlock.classList.remove('d-none');
      } else {
        headerBlock.classList.add('d-none');
      }
    }
    
    // 2. Student row display toggling
    if (showStudentInfoCheckbox.checked) {
      studentInfoRow.classList.remove('d-none');
    } else {
      studentInfoRow.classList.add('d-none');
    }

    // 3. Margin classes update
    a4PrintPage.className = `print-page ${document.querySelector('input[name="page-orientation"]:checked').value} ${pageMarginSelect.value}`;
    updatePrintOrientation();

    // 4. Render main fraction shapes based on mode
    if (currentMode === 'wall') {
      renderFractionWall();
    } else if (currentMode === 'single') {
      renderSingleShape();
    } else if (currentMode === 'grid') {
      renderCardsGrid();
    } else if (currentMode === 'notebook') {
      renderNotebook();
    } else if (currentMode === 'cutting') {
      // Force no-margin and no-header for cutting mode
      a4PrintPage.className = `print-page ${document.querySelector('input[name="page-orientation"]:checked').value} margin-none`;
      if (headerBlock) headerBlock.classList.add('d-none');
      renderCuttingWall();
    }
    
    updateZoom();
  }

  // --- CONTROL PANEL EVENTS AND BINDINGS ---

  // Page title / instruction update
  pageTitleInput.addEventListener('input', () => {
    renderPageTitle.textContent = pageTitleInput.value;
  });
  customInstructionInput.addEventListener('input', () => {
    renderPageInstruction.textContent = customInstructionInput.value || ' ';
  });
  showStudentInfoCheckbox.addEventListener('change', () => {
    renderWorkspace();
  });
  pageMarginSelect.addEventListener('change', () => {
    renderWorkspace();
  });

  // Orientation toggle
  document.querySelectorAll('input[name="page-orientation"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      const orient = e.target.value;
      if (orient === 'landscape') {
        a4PrintPage.classList.remove('portrait');
        a4PrintPage.classList.add('landscape');
      } else {
        a4PrintPage.classList.remove('landscape');
        a4PrintPage.classList.add('portrait');
      }
      renderWorkspace();
    });
  });

  // Mode Selection Card clicking
  document.querySelectorAll('.mode-card').forEach(card => {
    card.addEventListener('click', (e) => {
      const selectedMode = e.currentTarget.getAttribute('data-mode');
      
      document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('active'));
      e.currentTarget.classList.add('active');

      // Hide all panels
      document.querySelectorAll('.mode-specific-settings').forEach(p => p.classList.add('d-none'));
      
      // Show matching panel
      document.getElementById(`settings-${selectedMode}`).classList.remove('d-none');

      currentMode = selectedMode;
      renderWorkspace();
    });
  });

  // Color Palette handling
  colorPaletteSelect.addEventListener('change', (e) => {
    if (e.target.value === 'custom') {
      customColorPickers.style.display = 'flex';
    } else {
      customColorPickers.style.display = 'none';
    }
    renderWorkspace();
  });

  // Wall Height Slider
  wallHeightSlider.addEventListener('input', (e) => {
    wallHeightValDisplay.textContent = e.target.value;
    renderWorkspace();
  });

  // Notebook Pattern Select dynamic margin visibility
  notebookPatternSelect.addEventListener('change', (e) => {
    if (e.target.value === 'lined') {
      document.getElementById('notebook-red-margin-group').classList.remove('d-none');
    } else {
      document.getElementById('notebook-red-margin-group').classList.add('d-none');
    }
    renderWorkspace();
  });
  
  [colorFillPrimary, colorFillShaded, lineColorInput, fillModeSelect, shadingStyleSelect, lineStyleSelect, lineThicknessSelect, shapeSpacingSelect, labelFormatSelect, labelShadedOnlyCheckbox, labelFontSizeSelect, showWorksheetHeaderCheckbox, notebookSpacingSelect, notebookRedMarginCheckbox].forEach(element => {
    element.addEventListener('change', renderWorkspace);
  });

  // --- MODE SPECIFIC CONTROL BINDINGS ---

  // Single Shape
  singleShapeTypeSelect.addEventListener('change', (e) => {
    singleShapeType = e.target.value;
    
    // Toggle grid inputs
    if (singleShapeType === 'grid') {
      gridDimensionsGroup.classList.remove('d-none');
      singleDivGroup.classList.add('d-none');
    } else {
      gridDimensionsGroup.classList.add('d-none');
      singleDivGroup.classList.remove('d-none');
    }
    
    singleShaded.clear();
    renderWorkspace();
  });

  singleDivisionsSlider.addEventListener('input', (e) => {
    singleDivisions = parseInt(e.target.value);
    singleDivValDisplay.textContent = singleDivisions;
    singleShaded.clear();
    renderWorkspace();
  });

  gridColsInput.addEventListener('input', () => {
    gridCols = parseInt(gridColsInput.value) || 1;
    singleShaded.clear();
    renderWorkspace();
  });
  
  gridRowsInput.addEventListener('input', () => {
    gridRows = parseInt(gridRowsInput.value) || 1;
    singleShaded.clear();
    renderWorkspace();
  });

  // Cards/Grid Layout settings
  cardShapeTypeSelect.addEventListener('change', () => {
    cardShapeType = cardShapeTypeSelect.value;
    initCardsShaded();
    renderWorkspace();
  });

  cardLayoutColsInput.addEventListener('input', () => {
    cardLayoutCols = parseInt(cardLayoutColsInput.value) || 1;
    initCardsShaded();
    renderWorkspace();
  });

  cardLayoutRowsInput.addEventListener('input', () => {
    cardLayoutRows = parseInt(cardLayoutRowsInput.value) || 1;
    initCardsShaded();
    renderWorkspace();
  });

  document.querySelectorAll('input[name="card-divs-type"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      cardDivsType = e.target.value;
      if (cardDivsType === 'sequence') {
        cardDivsSameValGroup.classList.add('d-none');
        cardDivsSeqStartGroup.classList.remove('d-none');
      } else {
        cardDivsSameValGroup.classList.remove('d-none');
        cardDivsSeqStartGroup.classList.add('d-none');
      }
      initCardsShaded();
      renderWorkspace();
    });
  });

  cardDivsValSlider.addEventListener('input', (e) => {
    cardDivsVal = parseInt(e.target.value);
    cardDivsValDisplay.textContent = cardDivsVal;
    initCardsShaded();
    renderWorkspace();
  });

  cardDivsSeqStartInput.addEventListener('input', () => {
    cardDivsSeqStart = parseInt(cardDivsSeqStartInput.value) || 1;
    initCardsShaded();
    renderWorkspace();
  });

  cardDivsSeqStepInput.addEventListener('input', () => {
    cardDivsSeqStep = parseInt(cardDivsSeqStepInput.value) || 1;
    initCardsShaded();
    renderWorkspace();
  });

  // --- WALL ROWS LIST GENERATOR AND CONTROLS ---
  
  function updateWallRowsUI() {
    const list = document.getElementById('wall-rows-list');
    list.innerHTML = '';
    
    wallRows.forEach((divs, r) => {
      const li = document.createElement('li');
      li.className = 'wall-row-item';
      li.innerHTML = `
        <span class="row-num font-mali">แถว ${r+1}</span>
        <input type="range" class="wall-row-slider" data-row-idx="${r}" min="1" max="24" value="${divs}">
        <span class="row-val font-kanit">${divs}</span>
        <button class="btn-remove-row" data-row-idx="${r}" title="ลบแถวนี้"><i class="fa-solid fa-trash-can"></i></button>
      `;
      
      // Slider change event
      li.querySelector('.wall-row-slider').addEventListener('input', (e) => {
        const idx = parseInt(e.target.getAttribute('data-row-idx'));
        const val = parseInt(e.target.value);
        wallRows[idx] = val;
        li.querySelector('.row-val').textContent = val;
        
        // reset shading for this row as division changed
        if (wallShaded[idx]) wallShaded[idx].clear();
        renderWorkspace();
      });

      // Remove row button click
      li.querySelector('.btn-remove-row').addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.getAttribute('data-row-idx'));
        wallRows.splice(idx, 1);
        
        // Shift wall shaded lists
        initWallShaded(); // simplified reset
        updateWallRowsUI();
        renderWorkspace();
      });

      list.appendChild(li);
    });
  }

  // Add new wall row
  document.getElementById('btn-add-wall-row').addEventListener('click', () => {
    if (wallRows.length >= 20) {
      alert('จำนวนแถวสูงสุดคือ 20 แถวเพื่อคุณภาพที่ดีบนหน้ากระดาษ A4ค่ะ');
      return;
    }
    const lastVal = wallRows[wallRows.length - 1] || 1;
    wallRows.push(lastVal + 1);
    initWallShaded();
    updateWallRowsUI();
    renderWorkspace();
  });

  // Reset wall rows
  document.getElementById('btn-wall-reset').addEventListener('click', () => {
    wallRows = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    initWallShaded();
    updateWallRowsUI();
    renderWorkspace();
  });

  // Clear shading
  document.getElementById('btn-clear-shading').addEventListener('click', () => {
    if (currentMode === 'wall') {
      initWallShaded();
    } else if (currentMode === 'single') {
      singleShaded.clear();
    } else if (currentMode === 'grid') {
      initCardsShaded();
    }
    renderWorkspace();
  });

  // --- ZOOM SYSTEM FOR PREVIEW CANVAS ---
  
  const zoomLevelText = document.getElementById('zoom-level-text');
  
  function updateZoom() {
    const isPortrait = document.querySelector('input[name="page-orientation"]:checked').value === 'portrait';
    
    // Apply transform zoom scale
    a4PrintPage.style.transform = `scale(${zoomScale})`;
    
    // Scale container space correctly so that parent bounds wrap it properly
    const baseW = isPortrait ? 210 : 297;
    const baseH = isPortrait ? 297 : 210;
    
    // Use viewport parent element to force layout boundaries to match zoom
    const container = document.getElementById('canvas-viewport');
    
    // Force dimensions of page wrapper placeholder so scrollbars function smoothly
    let wrapper = document.getElementById('a4-scaled-wrapper');
    if (!wrapper) {
      wrapper = document.createElement('div');
      wrapper.id = 'a4-scaled-wrapper';
      a4PrintPage.parentNode.insertBefore(wrapper, a4PrintPage);
      wrapper.appendChild(a4PrintPage);
    }
    
    // Convert mm to pixels at standard web resolution (approx 96 DPI, or using relative size)
    // Here we can set size in mm multiplied by zoom
    wrapper.style.width = `${baseW * zoomScale}mm`;
    wrapper.style.height = `${baseH * zoomScale}mm`;
    wrapper.style.display = 'flex';
    wrapper.style.justifyContent = 'center';
    wrapper.style.alignItems = 'flex-start';
    wrapper.style.overflow = 'hidden';
    
    zoomLevelText.textContent = `${Math.round(zoomScale * 100)}%`;
  }

  document.getElementById('btn-zoom-in').addEventListener('click', () => {
    if (zoomScale < 1.5) {
      zoomScale += 0.1;
      updateZoom();
    }
  });

  document.getElementById('btn-zoom-out').addEventListener('click', () => {
    if (zoomScale > 0.3) {
      zoomScale -= 0.1;
      updateZoom();
    }
  });

  document.getElementById('btn-zoom-fit').addEventListener('click', () => {
    // Dynamically calculate best fit zoom scale
    const viewport = document.querySelector('.preview-area');
    const viewW = viewport.clientWidth - 80; // margins
    const viewH = viewport.clientHeight - 120; // controls spacing
    
    const isPortrait = document.querySelector('input[name="page-orientation"]:checked').value === 'portrait';
    // A4 Portrait in pixels (~794 x 1123)
    const pageW = isPortrait ? 794 : 1123;
    const pageH = isPortrait ? 1123 : 794;

    const scaleW = viewW / pageW;
    const scaleH = viewH / pageH;
    
    zoomScale = Math.min(scaleW, scaleH, 1.2); // Cap at 1.2
    zoomScale = Math.max(zoomScale, 0.3); // Min 0.3
    updateZoom();
  });

  // --- EXPORT TO IMAGE FUNCTION (PNG DOWNLOAD) ---
  
  document.getElementById('btn-export-image').addEventListener('click', () => {
    const svgEl = worksheetContent.querySelector('svg');
    if (!svgEl) {
      alert('ไม่พบรูปภาพเรขาคณิตที่สามารถเซฟได้ในโหมดปัจจุบันค่ะ');
      return;
    }

    try {
      const serializer = new XMLSerializer();
      let svgString = serializer.serializeToString(svgEl);
      
      // Inject standard styles inside SVG string to render correctly outside HTML context
      const styleString = `
        <style>
          .svg-interactive-part { stroke-linejoin: round; }
          .svg-label-text { font-family: 'Kanit', sans-serif; font-weight: 700; text-anchor: middle; dominant-baseline: middle; fill: #2b2b26; }
          .label-size-small { font-size: 10px; }
          .label-size-medium { font-size: 13px; }
          .label-size-large { font-size: 18px; }
        </style>
      `;
      svgString = svgString.replace('</svg>', `${styleString}</svg>`);

      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const DOMURL = window.URL || window.webkitURL || window;
      const url = DOMURL.createObjectURL(svgBlob);
      
      const img = new Image();
      img.onload = function() {
        const canvas = document.createElement('canvas');
        // Export high-res
        const scale = 2.5; 
        
        // Find dimensions
        const width = svgEl.clientWidth || svgEl.getBoundingClientRect().width || 600;
        const height = svgEl.clientHeight || svgEl.getBoundingClientRect().height || 500;
        
        canvas.width = width * scale;
        canvas.height = height * scale;
        
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff'; // White bg
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        const png = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = png;
        downloadLink.download = `CPARE-Fraction-${currentMode}-${Date.now()}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        DOMURL.revokeObjectURL(url);
      };
      
      img.onerror = function() {
        alert('เกิดข้อผิดพลาดในการแปลงไฟล์รูปภาพ แนะนำให้เซฟโดยพิมพ์เป็น PDF แทนค่ะ');
      }
      
      img.src = url;
    } catch (err) {
      console.error(err);
      alert('ไม่สามารถเซฟรูปภาพได้ในบราวเซอร์นี้ แนะนำให้เลือกใช้การเซฟเป็น PDF ผ่านเมนูพิมพ์ค่ะ');
    }
  });

  // --- PRINT BUTTON TRIGGER ---
  document.getElementById('btn-print-page').addEventListener('click', () => {
    window.print();
  });

  // --- PRESETS LOADING TEMPLATES ---
  
  const PRESETS = {
    'wall-standard': {
      mode: 'wall',
      title: 'กำแพงเศษส่วนเปรียบเทียบ (Fraction Wall)',
      instruction: 'ให้นักเรียนสังเกตขนาดของแถบเศษส่วนที่ยาวเท่ากันในแต่ละชั้น แล้วระบายสีเพื่อเปรียบเทียบค่าเศษส่วนที่กำหนด',
      showStudent: true,
      fillMode: 'colored',
      palette: 'pastel',
      shading: 'solid',
      lineStyle: 'solid',
      lineThickness: 'medium',
      lineColor: '#2b2b26',
      labelFormat: 'fraction',
      labelShadedOnly: false,
      fontSize: 'medium',
      wallRows: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      spacing: 'none'
    },
    'circles-compare': {
      mode: 'grid',
      shape: 'circle',
      title: 'วงกลมเศษส่วนกิจกรรมกลุ่ม (Fraction Circles)',
      instruction: 'ตัดรูปวงกลมเศษส่วนเหล่านี้ตามรอยประสีดำเพื่อนำมาใช้จัดกิจกรรมเปรียบเทียบเศษส่วนในชั้นเรียน',
      showStudent: false,
      fillMode: 'colored',
      palette: 'pastel',
      shading: 'solid',
      lineStyle: 'dashed',
      lineThickness: 'medium',
      lineColor: '#2b2b26',
      labelFormat: 'fraction',
      labelShadedOnly: false,
      fontSize: 'small',
      layoutCols: 2,
      layoutRows: 3,
      divsType: 'sequence',
      divsSeqStart: 2,
      divsSeqStep: 1, // 2, 3, 4, 5, 6, 7 parts
      spacing: 'medium'
    },
    'grid-worksheet': {
      mode: 'grid',
      shape: 'square',
      title: 'ใบงานแบบฝึกหัด: แรเงาเศษส่วนที่ถูกต้อง',
      instruction: 'ให้นักเรียนแรเงาลงในช่องเรขาคณิตด้านล่างตามตัวเลขเศษส่วนที่กำหนดให้ในแต่ละข้อ',
      showStudent: true,
      fillMode: 'interactive',
      palette: 'pastel',
      shading: 'hatch-diagonal',
      lineStyle: 'solid',
      lineThickness: 'medium',
      lineColor: '#2b2b26',
      labelFormat: 'blank',
      labelShadedOnly: false,
      fontSize: 'medium',
      layoutCols: 2,
      layoutRows: 3,
      divsType: 'sequence',
      divsSeqStart: 3,
      divsSeqStep: 1, // 3, 4, 5, 6, 7, 8 parts
      spacing: 'large'
    },
    'cutout-cards': {
      mode: 'grid',
      shape: 'strip',
      title: 'การ์ดแถบเศษส่วนสำหรับทำกิจกรรม',
      instruction: 'ตัดแถบเศษส่วนเหล่านี้ตามรอยประเพื่อจัดกิจกรรมจับคู่เศษส่วนที่เท่ากัน',
      showStudent: false,
      fillMode: 'colored',
      palette: 'rainbow',
      shading: 'solid',
      lineStyle: 'dashed',
      lineThickness: 'medium',
      lineColor: '#2b2b26',
      labelFormat: 'fraction',
      labelShadedOnly: false,
      fontSize: 'medium',
      layoutCols: 2,
      layoutRows: 4,
      divsType: 'sequence',
      divsSeqStart: 2,
      divsSeqStep: 1, // 2, 3, 4, 5, 6, 7, 8, 9
      spacing: 'medium'
    },
    'notebook-lined': {
      mode: 'notebook',
      title: 'กระดาษเส้นบรรทัดสำหรับเขียน',
      instruction: '',
      showWorksheetHeader: false,
      showStudent: false,
      fillMode: 'outline',
      palette: 'monochrome',
      shading: 'solid',
      lineStyle: 'solid',
      lineThickness: 'thin',
      lineColor: '#a0a0a0',
      labelFormat: 'blank',
      labelShadedOnly: false,
      fontSize: 'medium',
      spacing: 'none',
      notebookPattern: 'lined',
      notebookSpacing: '7',
      notebookRedMargin: true
    },
    'notebook-grid': {
      mode: 'notebook',
      title: 'กระดาษลายตารางกริดคณิตศาสตร์',
      instruction: '',
      showWorksheetHeader: false,
      showStudent: false,
      fillMode: 'outline',
      palette: 'monochrome',
      shading: 'solid',
      lineStyle: 'solid',
      lineThickness: 'thin',
      lineColor: '#bdbdbd',
      labelFormat: 'blank',
      labelShadedOnly: false,
      fontSize: 'medium',
      spacing: 'none',
      notebookPattern: 'grid',
      notebookSpacing: '10',
      notebookRedMargin: false
    },
    'cutting-strips': {
      mode: 'grid',
      shape: 'full-strip',
      title: '',
      instruction: '',
      showWorksheetHeader: false,
      showStudent: false,
      fillMode: 'outline',
      palette: 'monochrome',
      shading: 'solid',
      lineStyle: 'solid',
      lineThickness: 'medium',
      lineColor: '#2b2b26',
      labelFormat: 'fraction',
      labelShadedOnly: false,
      fontSize: 'medium',
      layoutCols: 1,
      layoutRows: 5,
      divsType: 'sequence',
      divsSeqStart: 2,
      divsSeqStep: 1,
      spacing: 'none',
      pageMargin: 'margin-none'
    }
  };

  function loadPreset(presetKey) {
    const config = PRESETS[presetKey];
    if (!config) return;

    // Load general values
    pageTitleInput.value = config.title;
    customInstructionInput.value = config.instruction;
    showStudentInfoCheckbox.checked = config.showStudent;
    showWorksheetHeaderCheckbox.checked = config.showWorksheetHeader !== false;
    wallHeightSlider.value = config.wallHeight || 620;
    wallHeightValDisplay.textContent = wallHeightSlider.value;
    fillModeSelect.value = config.fillMode;
    colorPaletteSelect.value = config.palette;
    
    if (config.palette === 'custom') {
      customColorPickers.style.display = 'flex';
    } else {
      customColorPickers.style.display = 'none';
    }

    shadingStyleSelect.value = config.shading;
    lineStyleSelect.value = config.lineStyle;
    lineThicknessSelect.value = config.lineThickness;
    lineColorInput.value = config.lineColor;
    labelFormatSelect.value = config.labelFormat;
    labelShadedOnlyCheckbox.checked = config.labelShadedOnly;
    labelFontSizeSelect.value = config.fontSize;
    shapeSpacingSelect.value = config.spacing;

    // Set page margin if specified
    if (config.pageMargin) {
      pageMarginSelect.value = config.pageMargin;
    }

    // Set mode
    currentMode = config.mode;
    
    // Highlight correct mode card
    document.querySelectorAll('.mode-card').forEach(c => {
      c.classList.remove('active');
      if (c.getAttribute('data-mode') === config.mode) c.classList.add('active');
    });

    // Hide all panels, show matching one
    document.querySelectorAll('.mode-specific-settings').forEach(p => p.classList.add('d-none'));
    document.getElementById(`settings-${config.mode}`).classList.remove('d-none');

    // Load mode-specific configs
    if (config.mode === 'wall') {
      wallRows = [...config.wallRows];
      initWallShaded();
      updateWallRowsUI();
    } 
    else if (config.mode === 'grid') {
      cardShapeTypeSelect.value = config.shape;
      cardShapeType = config.shape;
      
      cardLayoutColsInput.value = config.layoutCols;
      cardLayoutCols = config.layoutCols;
      
      cardLayoutRowsInput.value = config.layoutRows;
      cardLayoutRows = config.layoutRows;

      // check divs type
      document.querySelectorAll('input[name="card-divs-type"]').forEach(radio => {
        if (radio.value === config.divsType) {
          radio.checked = true;
          cardDivsType = config.divsType;
        }
      });
      
      if (config.divsType === 'sequence') {
        cardDivsSameValGroup.classList.add('d-none');
        cardDivsSeqStartGroup.classList.remove('d-none');
        cardDivsSeqStartInput.value = config.divsSeqStart;
        cardDivsSeqStart = config.divsSeqStart;
        cardDivsSeqStepInput.value = config.divsSeqStep;
        cardDivsSeqStep = config.divsSeqStep;
      } else {
        cardDivsSameValGroup.classList.remove('d-none');
        cardDivsSeqStartGroup.classList.add('d-none');
        cardDivsValSlider.value = config.divsVal || 6;
        cardDivsVal = config.divsVal || 6;
        cardDivsValDisplay.textContent = cardDivsVal;
      }
      initCardsShaded();
    }
    else if (config.mode === 'notebook') {
      notebookPatternSelect.value = config.notebookPattern || 'lined';
      notebookSpacingSelect.value = config.notebookSpacing || '7';
      notebookRedMarginCheckbox.checked = config.notebookRedMargin !== false;

      if (notebookPatternSelect.value === 'lined') {
        document.getElementById('notebook-red-margin-group').classList.remove('d-none');
      } else {
        document.getElementById('notebook-red-margin-group').classList.add('d-none');
      }
    }

    // Specially pre-shade grid worksheet to make it look ready
    if (presetKey === 'grid-worksheet') {
      initCardsShaded();
      // Pre shade some sections (e.g. Card 0 has 3 parts: shade 1, Card 1 has 4 parts: shade 2, etc.)
      const totalC = cardLayoutCols * cardLayoutRows;
      for (let cIdx = 0; cIdx < totalC; cIdx++) {
        const divs = config.divsSeqStart + cIdx * config.divsSeqStep;
        cardsShaded[cIdx] = new Set();
        // shade a fraction, e.g. about 1/3, 1/2, 2/5 etc.
        const shadeCount = Math.max(1, Math.floor(divs / 2));
        for (let s = 0; s < shadeCount; s++) {
          cardsShaded[cIdx].add(s);
        }
      }
    }

    renderWorkspace();
  }

  // Bind Preset Clickers
  document.querySelectorAll('.btn-preset').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const presetKey = e.currentTarget.getAttribute('data-preset');
      loadPreset(presetKey);
    });
  });

  // --- INITIAL LOADING ---
  updateWallRowsUI();
  loadPreset('wall-standard'); // default loaded preset
  
  // Set fit screen initially
  setTimeout(() => {
    document.getElementById('btn-zoom-fit').click();
  }, 300);

});
