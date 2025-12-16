// /public/js/PolarCanvasController.js

export default class PolarCanvasController {
    constructor(containerId, coordsDisplayId) {
        // Estado del Plano
        this.center = { x: 0, y: 0 }; // Coordenadas del plano (0,0) relativas al stage
        this.scale = 50; // Píxeles por unidad de radio. Define el zoom inicial.
        this.minScale = 0.005; // Escala mínima para r=10000
        this.maxScale = 1000; // Escala máxima para r=0.001

        // Inicializar Stage y Capas (Layers)
        this.stage = new Konva.Stage({
            container: containerId,
            width: document.getElementById(containerId).offsetWidth,
            height: document.getElementById(containerId).offsetHeight,
        });

        // Capas para la optimización del rendimiento
        this.gridLayer = new Konva.Layer();
        this.dataLayer = new Konva.Layer(); // Vectores y Círculos
        this.stage.add(this.gridLayer, this.dataLayer);

        // Referencia al display de coordenadas
        this.coordsDisplay = document.getElementById(coordsDisplayId);

        // Inicializar el Centro y las Transformaciones
        this.initializeView();

        // Configurar la Interactividad (Pan y Zoom)
        this.setupEventListeners();
        
        // Dibujo Inicial
        this.drawGrid();
    }

    // --- LÓGICA DE TRANSFORMACIÓN Y VISTA ---

    initializeView() {
        // Mostrar el origen (0,0) del plano en el centro del contenedor al inicio
        this.stage.container().style.backgroundColor = '#ffffff'; // Color de fondo claro para el canvas
        
        // Mover el punto de origen de la capa de datos al centro de la pantalla
        this.dataLayer.x(this.stage.width() / 2);
        this.dataLayer.y(this.stage.height() / 2);
        
        this.gridLayer.x(this.stage.width() / 2);
        this.gridLayer.y(this.stage.height() / 2);
        
        // Guardar las coordenadas del centro del stage para el pan.
        this.center = { x: this.stage.width() / 2, y: this.stage.height() / 2 };
        
        // Ajustar el evento de redimensionamiento de la ventana
        window.addEventListener('resize', this.handleResize.bind(this));
    }
    
    handleResize() {
        // Ajustar el tamaño del Stage al contenedor
        this.stage.width(document.getElementById('canvas-container').offsetWidth);
        this.stage.height(document.getElementById('canvas-container').offsetHeight);
        
        // Recalcular el centro y actualizar las capas
        this.center = { x: this.stage.width() / 2, y: this.stage.height() / 2 };
        this.dataLayer.x(this.center.x);
        this.dataLayer.y(this.center.y);
        this.gridLayer.x(this.center.x);
        this.gridLayer.y(this.center.y);
        
        this.drawGrid(); // Redibujar la cuadrícula para adaptarla al nuevo tamaño
    }

    // --- LÓGICA DEL DIBUJO ---

    drawGrid() {
        this.gridLayer.destroyChildren(); // Limpiar la capa antes de redibujar

        const maxRadius = Math.min(this.stage.width(), this.stage.height()) / 2;
        
        // Definir la separación de los círculos (debe ser proporcional a la escala)
        let step = 1; // Unidades del radio (r=1, r=2, etc.)
        
        // Ajustar la separación de las unidades basado en la escala (Zoom)
        // Lógica para mantener círculos "visibles" y proporcionales
        const unitSize = this.scale * step; // Tamaño en píxeles de una unidad de radio

        // Si la unidad es muy pequeña, aumentamos el paso
        if (unitSize < 20) {
            step = Math.ceil(20 / unitSize) * step;
        } 
        // Si la unidad es muy grande, disminuimos el paso
        else if (unitSize > 150) {
            step = step / Math.ceil(unitSize / 150);
            if (step < 1) step = 0.1; // Para radios decimales
        }
        
        // Círculos (Radios)
        for (let r = step; r * this.scale < maxRadius; r += step) {
            this.gridLayer.add(new Konva.Circle({
                radius: r * this.scale,
                stroke: '#e2e8f0', // Color de línea (slate-200)
                strokeWidth: 1,
            }));
            
            // Etiqueta del Radio
            this.gridLayer.add(new Konva.Text({
                x: r * this.scale, // Posición en el eje X
                y: 5,
                text: `r=${r.toFixed(3)}`,
                fill: '#64748b', // Text color (slate-500)
                fontSize: 10,
            }));
        }

        // Líneas Radiales (Ángulos)
        for (let angle = 0; angle < 360; angle += 30) {
            const angleRad = angle * Math.PI / 180;
            const endX = maxRadius * Math.cos(angleRad);
            const endY = maxRadius * Math.sin(angleRad);
            
            this.gridLayer.add(new Konva.Line({
                points: [0, 0, endX, -endY], // Usamos -Y para coordenadas cartesianas estándar (0° a la derecha, 90° arriba)
                stroke: '#e2e8f0', // Color de línea (slate-200)
                strokeWidth: 1,
            }));
            
            // Etiqueta del Ángulo
            this.gridLayer.add(new Konva.Text({
                x: endX * 0.9 + 5,
                y: -endY * 0.9 - 5,
                text: `${angle}°`,
                fill: '#64748b', // Text color (slate-500)
                fontSize: 12,
            }));
        }

        this.gridLayer.draw();
        this.dataLayer.draw(); // Dibuja la capa de datos si hay algo
    }

    // --- LÓGICA DE INTERACTIVIDAD (PAN Y ZOOM) ---

    setupEventListeners() {
        // --- 1. Pan (Mover Libremente) ---
        let isDragging = false;
        let lastPos = { x: 0, y: 0 };
        
        this.stage.on('mousedown touchstart', (e) => {
            isDragging = true;
            // Coordenadas del ratón relativas a la ventana/pantalla
            lastPos = { x: e.evt.clientX, y: e.evt.clientY };
        });

        this.stage.on('mousemove touchmove', (e) => {
            // Mostrar coordenadas del puntero
            this.updateCoordsDisplay(e.evt.clientX, e.evt.clientY);

            if (!isDragging) return;

            const newPos = { x: e.evt.clientX, y: e.evt.clientY };
            const dx = newPos.x - lastPos.x;
            const dy = newPos.y - lastPos.y;

            // Mover las capas
            this.gridLayer.x(this.gridLayer.x() + dx);
            this.gridLayer.y(this.gridLayer.y() + dy);
            this.dataLayer.x(this.dataLayer.x() + dx);
            this.dataLayer.y(this.dataLayer.y() + dy);

            // Redibujar
            this.stage.batchDraw(); 
            
            lastPos = newPos;
        });

        this.stage.on('mouseup touchend', () => {
            isDragging = false;
        });
        
        // --- 2. Zoom (Scroll) ---
        this.stage.on('wheel', (e) => {
            e.evt.preventDefault();
            
            const oldScale = this.scale;
            
            // Determinar el factor de zoom
            let newScale = e.evt.deltaY < 0 ? oldScale * 1.1 : oldScale / 1.1;
            
            // Aplicar límites de zoom
            if (newScale > this.maxScale) newScale = this.maxScale;
            if (newScale < this.minScale) newScale = this.minScale;
            
            // ZOOM CENTRADO EN EL ORIGEN (No mover x/y)
            // Simplemente actualizamos la escala. El centro de los círculos (0,0 de la capa) 
            // permanecerá en su posición actual en pantalla (definida por this.gridLayer.x/y).

            this.scale = newScale; // Actualizar la escala global

            this.drawGrid(); // Redibujar la cuadrícula con la nueva escala
        });
    }

    // --- CONVERSIÓN DE COORDENADAS Y DISPLAY ---

    // Convierte coordenadas de Pantalla (Píxeles) a Coordenadas Polares (r, theta)
    canvasToPolar(clientX, clientY) {
        // 1. Obtener la posición del puntero relativa al Stage
        const pointerPos = this.stage.getPointerPosition();
        if (!pointerPos) return { r: 0, theta: 0 };
        
        // 2. Obtener la posición relativa al Origen (0,0) del plano, compensando el Pan
        const x_canvas = pointerPos.x - this.gridLayer.x();
        const y_canvas = pointerPos.y - this.gridLayer.y(); // Nota: Y positivo es hacia abajo en Konva
        
        // 3. Convertir a Coordenadas Cartesianas Estándar (Y positivo hacia arriba)
        const x_cartesian = x_canvas / this.scale;
        const y_cartesian = -y_canvas / this.scale; 
        
        // 4. Convertir a Polares
        const r = Math.sqrt(x_cartesian * x_cartesian + y_cartesian * y_cartesian);
        // atan2(y, x) devuelve el ángulo en radianes entre [-PI, PI]
        let thetaRad = Math.atan2(y_cartesian, x_cartesian); 
        
        // 5. Convertir Radianes a Grados [0, 360)
        let thetaDeg = thetaRad * 180 / Math.PI;
        if (thetaDeg < 0) {
            thetaDeg += 360;
        }

        return { r: r, theta: thetaDeg };
    }

    updateCoordsDisplay(clientX, clientY) {
        const { r, theta } = this.canvasToPolar(clientX, clientY);
        this.coordsDisplay.innerHTML = `r: ${r.toFixed(3)}, &theta;: ${theta.toFixed(2)}°`;
    }
}