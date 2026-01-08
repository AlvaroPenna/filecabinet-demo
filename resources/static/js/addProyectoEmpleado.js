// 1. VARIABLES GLOBALES (Necesarias para que los clones accedan a los datos)
let listaGlobalTrabajadores = [];
let listaGlobalProyectos = [];

document.addEventListener('DOMContentLoaded', () => {

    cargarTrabajadores();
    cargarProyectos();

    const form = document.getElementById('horas-form');
    // const container = form; // (No se usa, pero lo dejo si lo querías)

    const templateContainer = document.createElement('div');
    templateContainer.className = 'form-rows';

    // Asegúrate de que tu HTML tenga estos elementos dentro de .form-group
    const formGroups = [
        document.querySelector('#trabajador') ? document.querySelector('#trabajador').closest('.form-group') : null,
        document.querySelector('#proyecto') ? document.querySelector('#proyecto').closest('.form-group') : null,
        document.querySelector('#dia') ? document.querySelector('#dia').closest('.form-group') : null,
        document.querySelector('#horas') ? document.querySelector('#horas').closest('.form-group') : null,
        document.querySelector('#descripcion') ? document.querySelector('#descripcion').closest('.form-group') : null
    ];

    formGroups.forEach(group => {
        if (group) {
            templateContainer.appendChild(group.cloneNode(true));
        }
    });

    // Clonar y limpiar
    function cloneAndResetFields(groupContainer) {
        const clone = groupContainer.cloneNode(true);
        const newRowIndex = document.querySelectorAll('.form-rows').length + 1;

        const originalSelects = document.querySelector('.form-rows').querySelectorAll('select');
        
        clone.querySelectorAll('select, input, textarea').forEach((field, index) => {
            const originalId = field.id;
            // IMPORTANTE: Mantenemos tu lógica de renombrado de IDs
            field.id = `${originalId}-${newRowIndex}`; 
            field.name = `${originalId}-${newRowIndex}`;

            if (field.tagName === 'SELECT') {
                 if(originalSelects[index]) {
                    field.innerHTML = originalSelects[index].innerHTML;
                    field.selectedIndex = 0;
                 }
            } else {
                field.value = '';
            }

            const label = clone.querySelector(`label[for="${originalId}"]`);
            if (label) {
                label.setAttribute('for', field.id);
            }
        });

        return clone;
    }

    // Añadir nueva fila
    function addFormRow() {
        const newRow = cloneAndResetFields(templateContainer);

        const deleteButtonDiv = document.createElement('div');
        deleteButtonDiv.className = 'form-group form-actions-row';
        deleteButtonDiv.innerHTML = `<button type="button" class="btn-delete-row">X</button>`;

        form.insertBefore(newRow, document.querySelector('.form-actions'));
        newRow.appendChild(deleteButtonDiv);

        deleteButtonDiv.querySelector('.btn-delete-row').addEventListener('click', function () {
            newRow.remove();
        });

        // NUEVO: Aquí activamos la escucha de eventos para la nueva fila clonada
        activarBusquedaEnFila(newRow);
    }

    form.addEventListener('submit', async function (event) {
        event.preventDefault();
        const filas = document.querySelectorAll('.form-rows');
        const promesas = [];

        filas.forEach(fila => {
            // CORRECCIÓN CRÍTICA: Buscar DENTRO de la fila (fila.querySelector) 
            // y usando selectores que coincidan con los IDs dinámicos (starts with ^)
            
            // Buscamos los inputs por su tipo o nombre parcial, ya que los IDs cambiaron al clonar
            const inputTrabajadorId = fila.querySelector('input[id^="trabajador_id"]');
            const inputProyectoId = fila.querySelector('input[id^="proyecto_id"]');
            const inputFecha = fila.querySelector('input[id^="dia"]');
            const inputHoras = fila.querySelector('input[id^="horas"]');
            const inputDesc = fila.querySelector('textarea[id^="descripcion"]');

            const valTrabajadorId = inputTrabajadorId ? inputTrabajadorId.value : null;
            const valProyectoId = inputProyectoId ? inputProyectoId.value : null;
            const valFecha = inputFecha ? inputFecha.value : null;
            const valHoras = inputHoras ? inputHoras.value : null;
            const valDesc = inputDesc ? inputDesc.value : '';

            if (valTrabajadorId && valProyectoId && valFecha && valHoras) {
                promesas.push(
                    fetch('http://localhost:8080/api/proyectos-trabajadores', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            empleado_id: parseInt(valTrabajadorId),
                            proyecto_id: parseInt(valProyectoId),
                            dia: valFecha,
                            horas: parseFloat(valHoras),
                            tareaRealizada: valDesc
                        })
                    })
                );
            }
        });

        try {
            await Promise.all(promesas);
            alert('¡Guardado con éxito! ✅');
            window.location.reload();
        } catch (error) {
            console.error(error); // Útil para ver el error real
            alert('Error al guardar algunas filas.');
        }
    });

    // Iniciar primera fila
    const firstRow = document.createElement('div');
    firstRow.className = 'form-rows';
    formGroups.forEach(group => {
        if(group) firstRow.appendChild(group);
    });
    // Si form-actions existe, insertar antes, si no al final
    const actions = document.querySelector('.form-actions');
    if(actions) form.insertBefore(firstRow, actions);
    else form.appendChild(firstRow);

    const addButtonDiv = document.createElement('div');
    addButtonDiv.className = 'form-group form-actions-row';
    addButtonDiv.innerHTML = `<button type="button" class="btn-add-row">+</button>`;
    firstRow.appendChild(addButtonDiv);

    addButtonDiv.querySelector('.btn-add-row').addEventListener('click', addFormRow);

    // Activamos la primera fila manualmente
    activarBusquedaEnFila(firstRow);
});

// NUEVA FUNCIÓN AUXILIAR: Para no repetir código y que funcione en los clones
// Busca el input visible y el hidden DENTRO de la fila que le pases
function activarBusquedaEnFila(fila) {
    // TRABAJADOR
    const inputTrab = fila.querySelector('input[list="lista-trabajadores"]'); // Buscamos por el atributo list
    const hiddenTrab = fila.querySelector('input[id^="trabajador_id"]'); // Buscamos por ID parcial

    if (inputTrab && hiddenTrab) {
        inputTrab.addEventListener('input', function() {
            const valorActual = this.value;
            // Usamos la variable GLOBAL
            const encontrado = listaGlobalTrabajadores.find(c => `${c.nombre} ${c.apellidos}` === valorActual);
            hiddenTrab.value = encontrado ? encontrado.id : '';
        });
    }

    // PROYECTO
    const inputProy = fila.querySelector('input[list="lista-proyectos"]');
    const hiddenProy = fila.querySelector('input[id^="proyecto_id"]');

    if (inputProy && hiddenProy) {
        inputProy.addEventListener('input', function() {
            const valorActual = this.value;
            // Usamos la variable GLOBAL
            const encontrado = listaGlobalProyectos.find(c => `${c.nombre}` === valorActual);
            hiddenProy.value = encontrado ? encontrado.id : '';
        });
    }
}

function volverAlIndex() {
    window.location.href = "/index";
}

function cargarTrabajadores() {
    const datalisttrabajador = document.getElementById('lista-trabajadores');
    
    fetch('http://localhost:8080/api/trabajadores') // O 'empleados' si cambiaste la API
        .then(response => response.json())
        .then(trabajadores => {
            listaGlobalTrabajadores = trabajadores; // 1. Guardar en global
            
            datalisttrabajador.innerHTML = '';
            trabajadores.forEach(trabajador => {
                const opcion = document.createElement('option');
                opcion.value = `${trabajador.nombre} ${trabajador.apellidos}`;
                datalisttrabajador.appendChild(opcion);
            });
            
            // NOTA: Ya no ponemos el addEventListener aquí, lo hace activarBusquedaEnFila
        })
        .catch(error => console.error('Error cargando trabajadores:', error));      
}

function cargarProyectos() {
    const datalistProyecto = document.getElementById('lista-proyectos');
    
    fetch('http://localhost:8080/api/proyectos')
        .then(response => response.json())
        .then(proyectos => {
            listaGlobalProyectos = proyectos; // 1. Guardar en global

            datalistProyecto.innerHTML = '';
            proyectos.forEach(proyecto => {
                const opcion = document.createElement('option');
                opcion.value = `${proyecto.nombre}`;
                datalistProyecto.appendChild(opcion);
            });
             // NOTA: Ya no ponemos el addEventListener aquí, lo hace activarBusquedaEnFila
        })
        .catch(error => console.error('Error cargando proyectos:', error));
}