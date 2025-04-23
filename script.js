document.addEventListener('DOMContentLoaded', () => {
    // Elementos del DOM
    const tasksContainer = document.getElementById('tasks-container');
    const addTaskBtn = document.getElementById('add-task-btn');
    const taskForm = document.getElementById('task-form');
    const taskFormModal = document.getElementById('task-form-modal');
    const confirmModal = document.getElementById('confirm-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const cancelTaskBtn = document.getElementById('cancel-task');
    const themeToggleBtn = document.getElementById('theme-toggle');
    const modalTitle = document.getElementById('modal-title');
    const taskIdInput = document.getElementById('task-id');
    const taskTitleInput = document.getElementById('task-title');
    const taskDescriptionInput = document.getElementById('task-description');
    const colorOptions = document.querySelectorAll('.color-option');
    const closeConfirmModalBtn = document.querySelector('.close-confirm-modal');
    const cancelDeleteBtn = document.querySelector('.cancel-delete');
    const confirmDeleteBtn = document.querySelector('.confirm-delete');
    
    // Estado
    let tasks = [];
    let currentTheme = 'light';
    let currentColor = 'default';
    let draggedTask = null;
    let taskToDelete = null;
    
    // Inicializar la aplicación
    init();
    
    function init() {
        cargarTema();
        cargarTareas();
        configurarEventos();
    }
    
    function configurarEventos() {
        // Cambio de tema
        themeToggleBtn.addEventListener('click', alternarTema);
        
        // Formulario de tareas
        addTaskBtn.addEventListener('click', abrirModalNuevaTarea);
        closeModalBtn.addEventListener('click', cerrarModal);
        cancelTaskBtn.addEventListener('click', cerrarModal);
        taskForm.addEventListener('submit', manejarEnvioTarea);
        
        // Selección de color
        colorOptions.forEach(option => {
            option.addEventListener('click', () => {
                colorOptions.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                currentColor = option.dataset.color;
            });
        });
        
        // Drag and drop
        tasksContainer.addEventListener('dragstart', manejarInicioArrastre);
        tasksContainer.addEventListener('dragover', manejarArrastreSobre);
        tasksContainer.addEventListener('dragleave', manejarSalidaArrastre);
        tasksContainer.addEventListener('drop', manejarSoltar);
        tasksContainer.addEventListener('dragend', manejarFinArrastre);
        
        // Modal de confirmación
        closeConfirmModalBtn.addEventListener('click', cerrarModalConfirmacion);
        cancelDeleteBtn.addEventListener('click', cerrarModalConfirmacion);
        confirmDeleteBtn.addEventListener('click', confirmarEliminacion);
    }
    
    // Funciones de tema
    function cargarTema() {
        const temaGuardado = localStorage.getItem('gestorTareasTema');
        if (temaGuardado) {
            currentTheme = temaGuardado;
            document.documentElement.setAttribute('data-theme', currentTheme);
            actualizarIconoTema();
        }
    }
    
    function alternarTema() {
        currentTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', currentTheme);
        localStorage.setItem('gestorTareasTema', currentTheme);
        actualizarIconoTema();
    }
    
    function actualizarIconoTema() {
        const icono = themeToggleBtn.querySelector('.material-icons');
        icono.textContent = currentTheme === 'light' ? 'brightness_4' : 'brightness_7';
    }
    
    // Funciones de tareas
    function cargarTareas() {
        const tareasGuardadas = localStorage.getItem('gestorTareasTareas');
        if (tareasGuardadas) {
            tasks = JSON.parse(tareasGuardadas);
            renderizarTareas();
        }
    }
    
    function guardarTareas() {
        localStorage.setItem('gestorTareasTareas', JSON.stringify(tasks));
        renderizarTareas();
    }
    
    function renderizarTareas() {
        tasksContainer.innerHTML = '';
        
        if (tasks.length === 0) {
            tasksContainer.innerHTML = '<p class="no-tasks">No hay tareas aún. ¡Agrega tu primera tarea!</p>';
            return;
        }
        
        tasks.forEach((tarea, indice) => {
            const elementoTarea = document.createElement('div');
            elementoTarea.className = `task-card ${tarea.color}`;
            elementoTarea.draggable = true;
            elementoTarea.dataset.id = tarea.id;
            
            elementoTarea.innerHTML = `
                <div class="task-number">${indice + 1}</div>
                <h3 class="task-title">${tarea.title}</h3>
                <p class="task-description">${tarea.description}</p>
                <div class="task-actions">
                    <button class="edit-task" data-id="${tarea.id}">
                        <span class="material-icons">edit</span>
                    </button>
                    <button class="delete-task" data-id="${tarea.id}">
                        <span class="material-icons">delete</span>
                    </button>
                </div>
            `;
            
            tasksContainer.appendChild(elementoTarea);
        });
        
        // Eventos para botones de acciones
        document.querySelectorAll('.edit-task').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tareaId = e.currentTarget.dataset.id;
                editarTarea(tareaId);
            });
        });
        
        document.querySelectorAll('.delete-task').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tareaId = e.currentTarget.dataset.id;
                mostrarModalConfirmacion(tareaId);
            });
        });
    }
    
    function abrirModalNuevaTarea() {
        modalTitle.textContent = 'Nueva Tarea';
        taskIdInput.value = '';
        taskTitleInput.value = '';
        taskDescriptionInput.value = '';
        currentColor = 'default';
        
        // Reiniciar selección de color
        colorOptions.forEach(opt => opt.classList.remove('selected'));
        document.querySelector('.color-option.default').classList.add('selected');
        
        taskFormModal.classList.add('active');
    }
    
    function abrirModalEditarTarea(tarea) {
        modalTitle.textContent = 'Editar Tarea';
        taskIdInput.value = tarea.id;
        taskTitleInput.value = tarea.title;
        taskDescriptionInput.value = tarea.description;
        currentColor = tarea.color;
        
        // Establecer selección de color
        colorOptions.forEach(opt => opt.classList.remove('selected'));
        document.querySelector(`.color-option.${tarea.color}`).classList.add('selected');
        
        taskFormModal.classList.add('active');
    }
    
    function cerrarModal() {
        taskFormModal.classList.remove('active');
    }
    
    function manejarEnvioTarea(e) {
        e.preventDefault();
        
        const titulo = taskTitleInput.value.trim();
        const descripcion = taskDescriptionInput.value.trim();
        const id = taskIdInput.value || Date.now().toString();
        
        if (!titulo) {
            alert('El título de la tarea es requerido');
            return;
        }
        
        const datosTarea = {
            id,
            title: titulo,
            description: descripcion,
            color: currentColor
        };
        
        if (taskIdInput.value) {
            // Actualizar tarea existente
            const indiceTarea = tasks.findIndex(tarea => tarea.id === id);
            if (indiceTarea !== -1) {
                tasks[indiceTarea] = datosTarea;
            }
        } else {
            // Agregar nueva tarea
            tasks.push(datosTarea);
        }
        
        guardarTareas();
        cerrarModal();
    }
    
    function editarTarea(tareaId) {
        const tarea = tasks.find(tarea => tarea.id === tareaId);
        if (tarea) {
            abrirModalEditarTarea(tarea);
        }
    }
    
    function mostrarModalConfirmacion(tareaId) {
        taskToDelete = tareaId;
        confirmModal.classList.add('active');
    }
    
    function cerrarModalConfirmacion() {
        confirmModal.classList.remove('active');
        taskToDelete = null;
    }
    
    function confirmarEliminacion() {
        if (taskToDelete) {
            tasks = tasks.filter(tarea => tarea.id !== taskToDelete);
            guardarTareas();
            cerrarModalConfirmacion();
        }
    }
    
    // Funciones de drag and drop
    function manejarInicioArrastre(e) {
        if (e.target.classList.contains('task-card')) {
            draggedTask = e.target;
            e.target.classList.add('dragging');
            
            // Establecer imagen de arrastre transparente
            e.dataTransfer.setDragImage(new Image(), 0, 0);
            e.dataTransfer.effectAllowed = 'move';
        }
    }
    
    function manejarArrastreSobre(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        const tarjetaTarea = e.target.closest('.task-card');
        if (tarjetaTarea && tarjetaTarea !== draggedTask) {
            const rect = tarjetaTarea.getBoundingClientRect();
            const puntoMedio = rect.top + rect.height / 2;
            
            if (e.clientY < puntoMedio) {
                // Insertar antes de esta tarea
                tasksContainer.insertBefore(draggedTask, tarjetaTarea);
            } else {
                // Insertar después de esta tarea
                tasksContainer.insertBefore(draggedTask, tarjetaTarea.nextSibling);
            }
        }
    }
    
    function manejarSalidaArrastre(e) {
        e.preventDefault();
    }
    
    function manejarSoltar(e) {
        e.preventDefault();
    }
    
    function manejarFinArrastre(e) {
        if (e.target.classList.contains('task-card')) {
            e.target.classList.remove('dragging');
            
            // Actualizar orden de tareas basado en nueva posición en el DOM
            const nuevasTareas = [];
            const elementosTareas = tasksContainer.querySelectorAll('.task-card');
            
            elementosTareas.forEach(elemento => {
                const tareaId = elemento.dataset.id;
                const tarea = tasks.find(tarea => tarea.id === tareaId);
                if (tarea) {
                    nuevasTareas.push(tarea);
                }
            });
            
            tasks = nuevasTareas;
            guardarTareas();
        }
    }
});