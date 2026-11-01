/* Menú, precios y WhatsApp de la arepera.
   Lo usan la tienda (index.html), el panel (/admin) y la API (api/stock.js).
   Para cambiar precios, nombres o el número, edita solo este archivo. */
(function (root) {
  const MENU = {
    /* La arepa cuesta $3.50 y trae 2 carnes y 1 extra; cada cosa adicional suma $0.50 */
    BASE: 3.5,
    ADD: 0.5,
    FREE: { carnes: 2, extras: 1 },

    /* WhatsApp de la arepera (formato internacional sin "+") y cómo se muestra */
    WHATSAPP: "584144741237",
    WHATSAPP_SHOW: "0414-474-1237",

    CATS: [
      { id: "carnes", name: "Carnes", hint: "Tu arepa de $3.50 trae 2 carnes y 1 extra. Cada cosa adicional suma $0.50", items: [
        { id: "mechada", name: "Carne mechada" },
        { id: "pollo", name: "Pollo desmechado" },
        { id: "pernil", name: "Pernil" },
        { id: "chicharron", name: "Chicharrón" },
        { id: "chorizo", name: "Chorizo" },
        { id: "jamon", name: "Jamón" },
        { id: "carne-asada", name: "Carne asada" },
      ] },
      { id: "quesos", name: "Quesos", hint: "Cada queso suma $0.50", items: [
        { id: "blanco", name: "Queso blanco rallado" },
        { id: "guayanes", name: "Queso guayanés" },
        { id: "demano", name: "Queso de mano" },
        { id: "amarillo", name: "Queso amarillo" },
      ] },
      { id: "otros", name: "Otros", hint: "Cada uno suma $0.50", items: [
        { id: "reina", name: "Reina pepiada" },
        { id: "perico", name: "Perico" },
        { id: "caraotas", name: "Caraotas negras" },
      ] },
      { id: "extras", name: "Extras", hint: "1 extra viene incluido. Los demás suman $0.50 cada uno", items: [
        { id: "aguacate", name: "Aguacate" },
        { id: "tajadas", name: "Tajadas" },
        { id: "huevo", name: "Huevo frito" },
        { id: "tomate", name: "Tomate" },
        { id: "ajo", name: "Salsa de ajo" },
        { id: "picante", name: "Picante" },
      ] },
    ],

    /* Bebidas: no van en la arepa, se suman directo al pedido */
    DRINK_GROUPS: [
      { name: "Refrescos Glup", items: [
        ["limon", "Limón", "glup-verde"], ["uva", "Uva", "glup-uva"], ["pina", "Piña", "glup-amarilla"], ["cola", "Cola", "glup-cola"],
      ].flatMap(([id, flavor, img]) => [
        { id: `glup-${id}-1`, name: `Glup ${flavor} 1 L`, price: 1.5, img, small: true, cheer: "¡Glup, glup, glup!" },
        { id: `glup-${id}-2`, name: `Glup ${flavor} 2 L`, price: 2.5, img, cheer: "¡Glup, glup, glup!" },
      ]) },
      { name: "Jugos naturales", items: [
        { id: "parchita", name: "Jugo de parchita", price: 2, img: "jugo-parchita", cheer: "¡Juguito de parchita!" },
        { id: "guayaba", name: "Jugo de guayaba", price: 2, img: "jugo-guayaba", cheer: "¡Rico jugo de guayaba!" },
        { id: "tamarindo", name: "Jugo de tamarindo", price: 2, img: "jugo-tamarindo", cheer: "¡Tamarindo, qué sabroso!" },
      ] },
      { name: "Malta", items: [
        { id: "malta", name: "Malta", price: 1.5, img: "malta", cheer: "¡Una malta bien fría!" },
      ] },
    ],
  };

  /* Todos los códigos de productos que se pueden marcar agotados */
  MENU.ALL_IDS = [
    ...MENU.CATS.flatMap(c => c.items.map(i => i.id)),
    ...MENU.DRINK_GROUPS.flatMap(g => g.items.map(d => d.id)),
  ];

  if (typeof module !== "undefined" && module.exports) module.exports = MENU;
  else root.MENU = MENU;
})(this);
