package com.filecabinet.filecabinet.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class ViewController {

    @GetMapping("/login")
    public String login() {
        return "login"; 
    }

    @GetMapping("/index")
    public String index() {
        return "index";
    }

    @GetMapping("/gasto/list")
    public String mostrarListaGastos() {
        return "list-gasto"; 
    }

    @GetMapping("/gasto/put")
    public String modificarGasto() {
        return "putGasto"; 
    }
    
    @GetMapping("/gasto/new")
    public String mostrarFormularioGasto() {
        return "addGastos"; 
    }

    @GetMapping("/factura/new")
    public String mostrarFormularioFactura() { 
        return "addFactura";
    }

    @GetMapping("/factura/list")
    public String mostrarFacturas() { 
        return "list-factura";
    }

    @GetMapping("/factura/put")
    public String ModificarFactura() { 
        return "putFactura";
    }

    @GetMapping("/cliente/new")
    public String mostrarFormularioCliente() {
      return "addCliente";  
    }

    @GetMapping("/empleado/new")
    public String mostrarFormularioTrabajador(){
        return "addEmpleado";
    }

    @GetMapping("/proyecto/new")
    public String monstrarFormularioProyecto(){
        return "addProyecto";
    }

    @GetMapping("/proyectoEmpleado/new")
    public String monstrarFormularioProyectoEmpleado(){
        return "addProyectoEmpleo";
    }

    @GetMapping("/presupuesto/new")
    public String mostrarFormularioPresupuesto() {
        return "addPresupuesto";
    }

    @GetMapping("/presupuesto/list")
    public String mostrarListadoPresupuesto() {
        return "list-presupuesto";
    }

    @GetMapping("/presupuesto/put")
    public String ModificarPresupuesto() { 
        return "putPresupuesto";
    }

}
