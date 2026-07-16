
    const noBtn = document.getElementById("noBtn");
    const yesBtn = document.getElementById("yesBtn");
    const modal = document.getElementById("modal");
    const music = document.getElementById("music");
    const backArrow = document.getElementById("backArrow");
    const buttonsContainer = document.querySelector(".buttons");

    let initialNoBtnRect;
    let yesBtnRect; // Para almacenar la posición y el tamaño del botón "Sí"

    // Valores para la repulsión (ajustados para mayor agresividad)
    const repulsionRadius = 120; // Radio más grande para activar el movimiento desde más lejos
    const moveAmount = 250; // Distancia de salto significativamente mayor

    function setInitialPositions() {
        // Establece la posición inicial del botón 'No'
        noBtn.style.position = 'static'; // Temporalmente estático para obtener su posición natural
        initialNoBtnRect = noBtn.getBoundingClientRect();
        noBtn.style.position = 'absolute'; // Vuelve a absoluto
        noBtn.style.left = `${initialNoBtnRect.left - noBtn.parentElement.getBoundingClientRect().left}px`;
        noBtn.style.top = `${initialNoBtnRect.top - noBtn.parentElement.getBoundingClientRect().top}px`;

        // Obtiene la posición y el tamaño del botón 'Sí'
        yesBtnRect = yesBtn.getBoundingClientRect();
        // Convierte a coordenadas relativas al 'buttonsContainer'
        const containerRect = buttonsContainer.getBoundingClientRect();
        yesBtnRect = {
            left: yesBtnRect.left - containerRect.left,
            top: yesBtnRect.top - containerRect.top,
            right: yesBtnRect.right - containerRect.left,
            bottom: yesBtnRect.bottom - containerRect.top,
            width: yesBtnRect.width,
            height: yesBtnRect.height
        };
    }

    window.addEventListener('load', () => {
        setInitialPositions(); // Establece ambas posiciones iniciales
        music.play().catch(error => {
            console.log("Auto-play prevented:", error);
        });
    });

    // Función para verificar si una posición se superpone con el botón "Sí"
    function overlapsWithYesButton(x, y, width, height) {
        // x, y son las coordenadas de la esquina superior izquierda relativas al buttonsContainer
        // yesBtnRect ya está en coordenadas relativas al buttonsContainer
        // Añadir un pequeño margen para evitar superposiciones justo en el borde
        const margin = 5;
        return !(x + width < yesBtnRect.left - margin ||
                 x > yesBtnRect.right + margin ||
                 y + height < yesBtnRect.top - margin ||
                 y > yesBtnRect.bottom + margin);
    }

    // Función para obtener las coordenadas del evento (mouse o táctil)
    function getEventCoords(e) {
      if (e.touches && e.touches.length > 0) {
        return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
      }
      return { clientX: e.clientX, clientY: e.clientY };
    }

    // Listener para mousemove y touchmove en el contenedor para el movimiento agresivo
    buttonsContainer.addEventListener("mousemove", handleNoButtonMovement);
    buttonsContainer.addEventListener("touchmove", handleNoButtonMovement);

    function handleNoButtonMovement(e) {
        // Prevenir el desplazamiento de la página en dispositivos táctiles para evitar interferencias
        if (e.type === 'touchmove') {
            e.preventDefault();
        }

        const { clientX: cursorX, clientY: cursorY } = getEventCoords(e);
        const noBtnRect = noBtn.getBoundingClientRect();
        const containerRect = buttonsContainer.getBoundingClientRect();

        const noBtnCenterX = noBtnRect.left + noBtnRect.width / 2;
        const noBtnCenterY = noBtnRect.top + noBtnRect.height / 2;

        const distanceX = cursorX - noBtnCenterX;
        const distanceY = cursorY - noBtnCenterY;
        const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

        if (distance < repulsionRadius) {
            const angle = Math.atan2(distanceY, distanceX);
            let newX = noBtnCenterX + Math.cos(angle) * (repulsionRadius + moveAmount);
            let newY = noBtnCenterY + Math.sin(angle) * (repulsionRadius + moveAmount);

            newX = newX - containerRect.left - noBtn.offsetWidth / 2;
            newY = newY - containerRect.top - noBtn.offsetHeight / 2;

            const maxX = containerRect.width - noBtn.offsetWidth;
            const maxY = containerRect.height - noBtn.offsetHeight;

            newX = Math.max(0, Math.min(newX, maxX));
            newY = Math.max(0, Math.min(newY, maxY));

            // Ajusta la posición si se superpone con el botón "Sí"
            let attempts = 0;
            const maxAttempts = 200;
            while (overlapsWithYesButton(newX, newY, noBtn.offsetWidth, noBtn.offsetHeight) && attempts < maxAttempts) {
                // Si se superpone, intenta moverlo a una nueva posición aleatoria
                newX = Math.random() * maxX;
                newY = Math.random() * maxY;
                attempts++;
            }

            noBtn.style.left = `${newX}px`;
            noBtn.style.top = `${newY}px`;
        }
    }

    // Manejar el clic (o tap) en el botón "No"
    noBtn.addEventListener("click", handleNoButtonClick);
    noBtn.addEventListener("touchend", handleNoButtonClick); // Usar touchend para detectar taps

    function handleNoButtonClick(e) {
        // Evita que el evento click se dispare después de touchend si el dispositivo lo hace
        if (e.type === 'touchend') {
            e.preventDefault();
        }

        const containerRect = buttonsContainer.getBoundingClientRect();
        const maxX = containerRect.width - noBtn.offsetWidth;
        const maxY = containerRect.height - noBtn.offsetHeight;

        let newX, newY;
        let attempts = 0;
        const maxAttempts = 300; // Más intentos para asegurar una buena posición

        // Calcular el centro del botón "Sí"
        const yesBtnCenterX = yesBtnRect.left + yesBtnRect.width / 2;
        const yesBtnCenterY = yesBtnRect.top + yesBtnRect.height / 2;

        // Calcular el punto opuesto para el botón "No"
        let targetX = (yesBtnCenterX < containerRect.width / 2) ? maxX : 0; // Al extremo opuesto horizontal

        // *** CAMBIO CLAVE AQUÍ: Aumentar la distancia vertical ***
        const verticalMoveMultiplier = 3; // El triple de distancia vertical
        let baseVerticalDistance = noBtn.offsetHeight + 50; // Distancia base (tamaño del botón + buffer)
        let desiredMinVerticalDistance = baseVerticalDistance * verticalMoveMultiplier; // Distancia vertical deseada

        // Determinar si el botón "Sí" está en la mitad superior o inferior del contenedor
        let targetY;
        if (yesBtnCenterY < containerRect.height / 2) {
            // Si "Sí" está en la mitad superior, "No" intenta ir a la parte inferior (maxY)
            targetY = maxY;
            // Asegurarse de que esté al menos 'desiredMinVerticalDistance' de la parte superior del botón "Sí"
            if (targetY - yesBtnRect.bottom < desiredMinVerticalDistance) {
                targetY = yesBtnRect.bottom + desiredMinVerticalDistance;
                // Ajustar si se sale del contenedor
                if (targetY + noBtn.offsetHeight > containerRect.height) {
                    targetY = maxY; // Volver a maxY si no hay espacio
                }
            }
        } else {
            // Si "Sí" está en la mitad inferior, "No" intenta ir a la parte superior (0)
            targetY = 0;
            // Asegurarse de que esté al menos 'desiredMinVerticalDistance' de la parte inferior del botón "Sí"
            if (yesBtnRect.top - targetY < desiredMinVerticalDistance) {
                targetY = yesBtnRect.top - desiredMinVerticalDistance - noBtn.offsetHeight;
                // Ajustar si se sale del contenedor
                if (targetY < 0) {
                    targetY = 0; // Volver a 0 si no hay espacio
                }
            }
        }
        targetY = Math.max(0, Math.min(targetY, maxY)); // Asegurar que no se salga de los límites verticales

        // Intentar posicionar el botón 'No' en el área "opuesta" con la nueva lógica vertical
        newX = targetX;
        newY = targetY;

        // Si la posición inicial calculada se superpone, busca una aleatoria pero lejana
        let isOverlapping = overlapsWithYesButton(newX, newY, noBtn.offsetWidth, noBtn.offsetHeight);

        if (isOverlapping) {
             // Si se superpone, busca una nueva posición completamente aleatoria
             // pero que no se superponga con el botón "Sí"
            do {
                newX = Math.random() * maxX;
                newY = Math.random() * maxY;
                attempts++;
            } while (overlapsWithYesButton(newX, newY, noBtn.offsetWidth, noBtn.offsetHeight) && attempts < maxAttempts);
        } else {
             // Si la posición opuesta calculada es buena, verifiquemos que no esté muy cerca
             const currentDistance = Math.sqrt(Math.pow(newX - yesBtnRect.left, 2) + Math.pow(newY - yesBtnRect.top, 2));
             if (currentDistance < moveAmount * 1.5) { // Un poco más de impulso para la reubicación
                 do {
                    newX = Math.random() * maxX;
                    newY = Math.random() * maxY;
                    attempts++;
                } while (overlapsWithYesButton(newX, newY, noBtn.offsetWidth, noBtn.offsetHeight) && attempts < maxAttempts);
             }
        }

        noBtn.style.left = `${newX}px`;
        noBtn.style.top = `${newY}px`;
    }

    yesBtn.addEventListener("click", () => {
        modal.style.display = "flex";
        music.pause();
    });

    backArrow.addEventListener("click", (event) => {
        event.preventDefault();
        modal.style.display = "none";
    });
  