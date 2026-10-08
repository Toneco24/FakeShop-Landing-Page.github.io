const URL_API = "https://fakestoreapi.com/products?limit=4";

const ideasProductos = {
	1: {
		nombre: "Delineado a prueba de ladridos",
		descripcion: "Sombras, rubor y mirada de «yo no fui» para el perro que ya es más fotogénico que tú.",
		etiqueta: "Maquillaje canino",
		imagen: "assets/perro.png",
		textoAlternativo: "Perro con maquillaje y expresión coqueta",
		leyendaHero: "Maquillaje para perros: porque ese «mírame, humano» merece un delineado impecable.",
	},
	2: {
		nombre: "Plan de estudio: faltar con bíceps",
		descripcion: "La camiseta oficial del alumno que no fue a clase, pero sí entrenó el brazo de pasar páginas.",
		etiqueta: "Ausencia musculada",
		imagen: "assets/camisa.jpeg",
		textoAlternativo: "Camiseta con un esqueleto musculoso que presume de faltar a clase",
	},
	3: {
		nombre: "iPhone 7: funda sabor manzana",
		descripcion: "Pantalla con merienda integrada. Ideal para cuando el celular tiene más hambre que batería.",
		etiqueta: "Tecnología nutritiva",
		imagen: "assets/iphone.png",
		textoAlternativo: "Teléfono rotulado iPhone 7 con una manzana mordida pegada",
	},
	4: {
		nombre: "Kit de supervivencia: papá no incluido",
		descripcion: "Trae caja, accesorios y una explicación que nunca llega. Pilas y figura paterna no incluidas.",
		etiqueta: "Edición incompleta",
		imagen: "assets/juguete.png",
		textoAlternativo: "Juguete en una caja que anuncia que el padre no está incluido",
	},
};

const cuadriculaProductos = document.querySelector("#product-grid");
const ventanaCarrito = document.querySelector("#cart-dialog");
const listaCarrito = document.querySelector("#cart-items");
const contadorCarrito = document.querySelector("#cart-count");
const totalCarrito = document.querySelector("#cart-total");
const botonCompra = document.querySelector("#checkout-button");
const aviso = document.querySelector("#toast");
const botonCarrito = document.querySelector("#open-cart");
const carrito = new Map();
let temporizadorAviso;

const formatoEuros = new Intl.NumberFormat("es-ES", {
	style: "currency",
	currency: "EUR",
});

function crearElemento(nombreEtiqueta, nombreClase, texto) {
	const elemento = document.createElement(nombreEtiqueta);
	if (nombreClase) elemento.className = nombreClase;
	if (texto !== undefined) elemento.textContent = texto;
	return elemento;
}

function crearTarjetaProducto(producto, indice) {
	const idea = ideasProductos[producto.id] ?? {
		nombre: "Una compra de dudosa prioridad",
		descripcion: "Es perfectamente útil para una necesidad que todavía no has inventado.",
		etiqueta: "Casi necesario",
	};

	const tarjeta = crearElemento("article", "product-card");
	tarjeta.style.animationDelay = `${indice * 70}ms`;

	const contenedorImagen = crearElemento("div", "product-card__image-wrap");
	const imagen = crearElemento("img", "product-card__image");
	imagen.src = idea.imagen;
	imagen.alt = idea.textoAlternativo;
	imagen.loading = "lazy";
	contenedorImagen.append(imagen);
	contenedorImagen.append(crearElemento("span", "product-card__number", `0${indice + 1} / 04`));
	contenedorImagen.append(crearElemento("span", "product-card__tag", idea.etiqueta));

	const contenido = crearElemento("div", "product-card__body");
	contenido.append(crearElemento("h3", "product-card__title", idea.nombre));
	contenido.append(crearElemento("p", "product-card__original", idea.descripcion));

	const pieTarjeta = crearElemento("div", "product-card__bottom");
	pieTarjeta.append(crearElemento("span", "product-card__price", formatoEuros.format(producto.price)));

	const botonAgregar = crearElemento("button", "add-button", "Lo necesito *");
	botonAgregar.type = "button";
	botonAgregar.setAttribute("aria-label", `Añadir ${idea.nombre} a la bolsa`);
	botonAgregar.addEventListener("click", () => agregarAlCarrito(producto, idea));
	pieTarjeta.append(botonAgregar);

	contenido.append(pieTarjeta);
	tarjeta.append(contenedorImagen, contenido);
	return tarjeta;
}

function mostrarProductos(productos) {
	cuadriculaProductos.replaceChildren(...productos.map(crearTarjetaProducto));
	cuadriculaProductos.setAttribute("aria-busy", "false");

	const productoDestacado = productos[0];
	if (productoDestacado) {
		const ideaDestacada = ideasProductos[productoDestacado.id];
		const imagenDestacada = crearElemento("img");
		imagenDestacada.src = ideaDestacada.imagen;
		imagenDestacada.alt = ideaDestacada.textoAlternativo;
		imagenDestacada.fetchPriority = "high";
		document.querySelector("#hero-photo").replaceChildren(imagenDestacada);
		document.querySelector("#hero-caption").textContent = ideaDestacada.leyendaHero;
	}
}

function mostrarCarrito() {
	const productosEnCarrito = [...carrito.values()];
	const cantidadTotal = productosEnCarrito.reduce((total, articulo) => total + articulo.cantidad, 0);
	const subtotal = productosEnCarrito.reduce((total, articulo) => total + articulo.producto.price * articulo.cantidad, 0);

	contadorCarrito.textContent = cantidadTotal;
	botonCarrito.setAttribute("aria-label", `Abrir bolsa, ${cantidadTotal} ${cantidadTotal === 1 ? "artículo" : "artículos"}`);
	totalCarrito.textContent = formatoEuros.format(subtotal);
	botonCompra.disabled = cantidadTotal === 0;

	if (productosEnCarrito.length === 0) {
		listaCarrito.replaceChildren(
			crearElemento("p", "cart-empty", "Tu bolsa está vacía. Por una vez, tu cartera y tu sentido común están de acuerdo."),
		);
		return;
	}

	const elementosCarrito = productosEnCarrito.map(({ producto, idea, cantidad }) => {
		const articulo = crearElemento("div", "cart-item");
		const imagen = crearElemento("img", "cart-item__image");
		imagen.src = idea.imagen;
		imagen.alt = idea.textoAlternativo;
		const detalles = crearElemento("div");
		detalles.append(crearElemento("p", "cart-item__title", idea.nombre));
		detalles.append(crearElemento("p", "cart-item__quantity", `Cantidad: ${cantidad}`));
		articulo.append(imagen, detalles, crearElemento("span", "cart-item__price", formatoEuros.format(producto.price * cantidad)));
		return articulo;
	});

	listaCarrito.replaceChildren(...elementosCarrito);
}

function agregarAlCarrito(producto, idea) {
	const articulo = carrito.get(producto.id);
	if (articulo) {
		articulo.cantidad += 1;
	} else {
		carrito.set(producto.id, { producto, idea: ideasProductos[producto.id] ?? idea, cantidad: 1 });
	}

	mostrarCarrito();
	mostrarAviso("Añadido a la bolsa. Era completamente evitable.");
}

function mostrarAviso(mensaje) {
	aviso.textContent = mensaje;
	aviso.classList.add("is-visible");
	clearTimeout(temporizadorAviso);
	temporizadorAviso = setTimeout(() => aviso.classList.remove("is-visible"), 2600);
}

async function cargarProductos() {
	cuadriculaProductos.setAttribute("aria-busy", "true");
	try {
		const respuesta = await fetch(URL_API);
		if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status}`);

		const productos = await respuesta.json();
		if (!Array.isArray(productos) || productos.length === 0) {
			throw new Error("La tienda está temporalmente vacía.");
		}

		mostrarProductos(productos);
	} catch (error) {
		console.error("No se pudo cargar FakeStoreAPI:", error);
		cuadriculaProductos.setAttribute("aria-busy", "false");

		const mensajeError = crearElemento("div", "error-message");
		mensajeError.append(crearElemento("p", "", "Los productos se fueron a replantearse sus prioridades."));
		const botonReintentar = crearElemento("button", "add-button", "Intentar de nuevo");
		botonReintentar.type = "button";
		botonReintentar.addEventListener("click", cargarProductos);
		mensajeError.append(botonReintentar);
		cuadriculaProductos.replaceChildren(mensajeError);
	}
}

botonCarrito.addEventListener("click", () => ventanaCarrito.showModal());
document.querySelector("#close-cart").addEventListener("click", () => ventanaCarrito.close());

ventanaCarrito.addEventListener("click", (evento) => {
	if (evento.target === ventanaCarrito) ventanaCarrito.close();
});

botonCompra.addEventListener("click", () => {
	ventanaCarrito.close();
	mostrarAviso("Gracias por apoyar las compras que nadie necesitaba. (Es una demo: no se cobró nada.)");
});

mostrarCarrito();
cargarProductos();
