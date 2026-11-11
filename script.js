
// CARGAR DATOS GUARDADOS
let socios = JSON.parse(localStorage.getItem("socios")) || [];
let inscripciones = JSON.parse(localStorage.getItem("inscripciones")) || [];

// ELEMENTOS HTML
const formulario = document.getElementById("formSocio");
const listaSocios = document.getElementById("listaSocios");

const formularioInscripcion = document.getElementById("formInscripcion");
const listaInscripciones = document.getElementById("listaInscripciones");

const planInscripcion = document.getElementById("planInscripcion");

const socioInscripcion = document.getElementById("socioInscripcion");

// CARGAR SOCIOS EN EL SELECTOR
async function cargarSociosEnSelector() {
    try {
        const respuesta = await fetch("/api/socios");

        if (!respuesta.ok) {
            throw new Error("No se pudieron cargar los socios");
        }

        const sociosBD = await respuesta.json();

        socioInscripcion.innerHTML =
            '<option value="">Seleccionar socio</option>';

        sociosBD.forEach(function(socio) {
            const opcion = document.createElement("option");

            opcion.value = socio.id_socio;
            opcion.textContent = socio.nombre + " " + socio.apellido;

            socioInscripcion.appendChild(opcion);
        });

    } catch (error) {
        console.error(error);
        alert("No se pudieron cargar los socios");
    }
}

cargarSociosEnSelector();



// GUARDAR SOCIOS
function guardarSocios() {
    localStorage.setItem("socios", JSON.stringify(socios));
}

// MOSTRAR SOCIOS

async function mostrarSocios() {
    listaSocios.innerHTML = "";

    socios.forEach(function(socio, indice) {
        const nuevoSocio = document.createElement("li");

        const texto = document.createElement("span");
        texto.textContent =
            socio.nombre + " " + socio.apellido + " - DNI: " + socio.dni;

        const botonEditar = document.createElement("button");
        botonEditar.textContent = "Editar";
        botonEditar.type = "button";

        const botonEliminar = document.createElement("button");
        botonEliminar.textContent = "Eliminar";
        botonEliminar.type = "button";

        // EDITAR SOCIO EN POSTGRESQL
        botonEditar.addEventListener("click", async function() {
            const nuevoNombre = prompt("Nuevo nombre:", socio.nombre);
            if (nuevoNombre === null || nuevoNombre.trim() === "") return;

            const nuevoApellido = prompt("Nuevo apellido:", socio.apellido);
            if (nuevoApellido === null || nuevoApellido.trim() === "") return;

            const nuevoDni = prompt("Nuevo DNI:", socio.dni);
            if (nuevoDni === null || nuevoDni.trim() === "") return;

            try {
                const respuesta = await fetch(
                    "/api/socios/" + socio.id_socio,
                    {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            nombre: nuevoNombre.trim(),
                            apellido: nuevoApellido.trim(),
                            dni: nuevoDni.trim()
                        })
                    }
                );

                if (!respuesta.ok) {
                    throw new Error("No se pudo actualizar el socio");
                }

                socios[indice] = await respuesta.json();

                guardarSocios();
                mostrarSocios();
                actualizarDashboard();

                alert("Socio actualizado correctamente");

            } catch (error) {
                console.error(error);
                alert("No se pudo editar el socio");
            }
        });

        // ELIMINAR SOCIO DE POSTGRESQL
        botonEliminar.addEventListener("click", async function() {
            if (!confirm("¿Seguro que querés eliminar este socio?")) return;

            try {
                const respuesta = await fetch(
                    "/api/socios/" + socio.id_socio,
                    { method: "DELETE" }
                );

                if (!respuesta.ok) {
                    throw new Error("No se pudo eliminar el socio");
                }

                socios.splice(indice, 1);

                guardarSocios();
                mostrarSocios();
                actualizarDashboard();

                alert("Socio eliminado correctamente");

            } catch (error) {
                console.error(error);
                alert("No se pudo eliminar. Puede tener inscripciones asociadas.");
            }
        });

        nuevoSocio.appendChild(texto);
        nuevoSocio.appendChild(botonEditar);
        nuevoSocio.appendChild(botonEliminar);

        listaSocios.appendChild(nuevoSocio);
    });
}

// AGREGAR SOCIOS

 
// AGREGAR SOCIOS DESDE POSTGRESQL
formulario.addEventListener("submit", async function(event) {
    event.preventDefault();

    const nombre = document.getElementById("nombre").value.trim();
    const apellido = document.getElementById("apellido").value.trim();
    const dni = document.getElementById("dni").value.trim();

    const dniExiste = socios.some(function(socio) {
        return socio.dni === dni;
    });

    if (dniExiste) {
        alert("Ya existe un socio registrado con ese DNI");
        return;
    }

    try {
        const respuesta = await fetch("/api/socios", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                nombre: nombre,
                apellido: apellido,
                dni: dni
            })
        });

        if (!respuesta.ok) {
            throw new Error("No se pudo guardar el socio");
        }

        const nuevoSocio = await respuesta.json();

        socios.push(nuevoSocio);
        guardarSocios();
        mostrarSocios();
        actualizarDashboard();

        formulario.reset();
        alert("Socio agregado correctamente a PostgreSQL");

    } catch (error) {
        console.error(error);
        alert("Hubo un problema al guardar el socio");
    }
});


// GUARDAR INSCRIPCIONES
function guardarInscripciones() {
    localStorage.setItem("inscripciones", JSON.stringify(inscripciones));
}
// CARGAR INSCRIPCIONES DESDE POSTGRESQL
async function cargarInscripcionesDesdeBD() {
    try {
        const respuesta = await fetch("/api/inscripciones");

        if (!respuesta.ok) {
            throw new Error("No se pudieron cargar las inscripciones");
        }

        inscripciones = await respuesta.json();

        mostrarInscripciones();
        actualizarDashboard();

    } catch (error) {
        console.error(error);
        alert("No se pudieron cargar las inscripciones");
    }
}

// MOSTRAR INSCRIPCIONES

function mostrarInscripciones() {
    listaInscripciones.innerHTML = "";

    inscripciones.forEach(function(inscripcion) {
        const nuevaInscripcion = document.createElement("li");

        const texto = document.createElement("span");
        texto.textContent =
            inscripcion.nombre + " " +
            (inscripcion.apellido || "") +
            " - Plan " + inscripcion.plan;

        const botonEliminar = document.createElement("button");
        botonEliminar.textContent = "Eliminar";
        botonEliminar.type = "button";

        botonEliminar.addEventListener("click", async function() {
            const confirmar = confirm("¿Querés eliminar esta inscripción?");

            if (!confirmar) return;

            try {
                const respuesta = await fetch(
                    "/api/inscripciones/" + inscripcion.id_inscripcion,
                    { method: "DELETE" }
                );

                if (!respuesta.ok) {
                    throw new Error("No se pudo eliminar");
                }

                await cargarInscripcionesDesdeBD();

            } catch (error) {
                console.error(error);
                alert("No se pudo eliminar la inscripción");
            }
        });

        nuevaInscripcion.appendChild(texto);
        nuevaInscripcion.appendChild(botonEliminar);

        listaInscripciones.appendChild(nuevaInscripcion);
    });
}


// SELECCIONAR PLAN
const botonesPlanes = document.querySelectorAll(".elegir-plan");

botonesPlanes.forEach(function(boton) {
    boton.addEventListener("click", function() {
        planInscripcion.value = boton.dataset.plan;

        document.getElementById("inscripciones").scrollIntoView({
            behavior: "smooth"
        });
    });
});


// REGISTRAR INSCRIPCIONES

formularioInscripcion.addEventListener("submit", async function(event) {
    event.preventDefault();

    const id_socio = socioInscripcion.value;
    const id_plan = planInscripcion.value;

    if (!id_socio || !id_plan) {
        alert("Seleccioná un socio y un plan");
        return;
    }

    try {
        const respuesta = await fetch("/api/inscripciones", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id_socio: Number(id_socio),
                id_plan: Number(id_plan)
            })
        });

        if (!respuesta.ok) {
            throw new Error("No se pudo registrar la inscripción");
        }

        await cargarInscripcionesDesdeBD();

        formularioInscripcion.reset();

        alert("¡Inscripción realizada correctamente!");

    } catch (error) {
        console.error(error);
        alert("Hubo un error al registrar la inscripción");
    }
});


// ACTUALIZAR ESTADISTICAS
function actualizarDashboard() {

    document.getElementById("totalSocios").textContent = socios.length;

    document.getElementById("totalInscripciones").textContent = inscripciones.length;

    const precios = {
        "Básico": 15000,
        "Premium": 25000,
        "Completo": 35000
    };

    let ingresos = 0;

    inscripciones.forEach(function(inscripcion) {
        ingresos += precios[inscripcion.plan] || 0;
    });

    document.getElementById("ingresosTotales").textContent =
        "$" + ingresos.toLocaleString("es-AR");

    const cantidades = {
        "Básico": 0,
        "Premium": 0,
        "Completo": 0
    };

    inscripciones.forEach(function(inscripcion) {
        if (cantidades[inscripcion.plan] !== undefined) {
            cantidades[inscripcion.plan]++;
        }
    });

    let planPopular = "Sin datos";
    let mayorCantidad = 0;

    for (let plan in cantidades) {
        if (cantidades[plan] > mayorCantidad) {
            mayorCantidad = cantidades[plan];
            planPopular = plan;
        }
    }

    document.getElementById("planPopular").textContent = planPopular;
}

// CARGAR SOCIOS DESDE POSTGRESQL
async function cargarSociosDesdeBD() {
    try {
        const respuesta = await fetch("/api/socios");

        if (!respuesta.ok) {
            throw new Error("No se pudieron cargar los socios");
        }

        socios = await respuesta.json();

        mostrarSocios();
        actualizarDashboard();

        console.log("Socios cargados desde PostgreSQL");
    } catch (error) {
        console.error("Error:", error);
        alert("No se pudieron cargar los socios desde la base de datos");
    }
}
// MOSTRAR DATOS AL ABRIR LA PÁGINA
cargarSociosDesdeBD();
mostrarInscripciones();
actualizarDashboard();
// BUSCAR SOCIOS
const buscadorSocios = document.getElementById("buscarSocio");

buscadorSocios.addEventListener("input", function() {
    const busqueda = buscadorSocios.value.toLowerCase();

    const sociosFiltrados = socios.filter(function(socio) {
        return (
            socio.nombre.toLowerCase().includes(busqueda) ||
            socio.apellido.toLowerCase().includes(busqueda) ||
            socio.dni.toLowerCase().includes(busqueda)
        );
    });

    listaSocios.innerHTML = "";

    sociosFiltrados.forEach(function(socio) {
        const nuevoSocio = document.createElement("li");

        nuevoSocio.textContent =
            socio.nombre + " " + socio.apellido + " - DNI: " + socio.dni;

        listaSocios.appendChild(nuevoSocio);
    });
});
