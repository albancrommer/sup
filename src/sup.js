(function (window, undefined) {
    "use strict";
    /**
    * The hopefully easy to setup, run everywhere user profiler.
    * 
    * <p>Sup aims to allow simple configuration in order to be reusable. 
    * It is technically a singleton object broken into multiple sub-objects:</p>
    * <ul>
    * <li>{@link Sup.Agents} are the autonomous elements you create to interact
    * with your users, you must declare them at configuration.</li>
    * <li>{@link Sup.Controller} takes care of data both externally (loading/saving) 
    * and internally (parsing/converting/distributing)</li>
    * <li>{@link Sup.Dispatcher} acts as a middleman between the Controller and 
    * the Agents actually instancing the later ones in a Factory way.</li>
    * <li>{@link Sup.Strategy} depends on you to be defined (State Machine, 
    * Behaviour Tree, etc.) and set the agents to be dispatched.</li>
    * </ul>
    * <p>The system uses a request object -owned by {@link Sup.Controller}- that
    * contains the user profile. It is pulled and pushed as JSON data following
    * read & write methods you must declare at configuration. 
    * </p>
    *  
    * @class the Simple User Profiler. Because users need help. 
    */
    var Sup =  {};

    /** 
     * This is the principal method you'll use : it sets things up while keeping the internals away 
     * @param params your configuration object 
     * @return self for fluent interface Sup.configure(...).run()
     **/
    Sup.configure = function (params) {
        Sup.Controller.read = params.read || function () {};
        Sup.Controller.write = params.write || function () {};
        if ( params["strategy"] ){ 
            Sup.Strategy._fn = params["strategy"];
        }
        if ( params["agents"] ){ 
            Sup.Agents._list = params["agents"];
        }
        return Sup;
    };
    
    /** Once configured, let Sup run.
     **/
    Sup.run = function () {
        Sup.Controller.load();
        Sup.Dispatcher._list = Sup.Strategy.run();
        Sup.Dispatcher.run();
    };
        
    /** When in doubt, use this method to have Sup return it's own debugging info
     * @usage in console : Sup.debug()
     **/
    Sup.debug = function () {
        for(var i in Sup){
            if ( typeof( Sup[i] ) == "object"){
                Sup[i]._debug();
            }
        }    
    }
    

    // Agents
   
   Sup.Agents = { /** @lends Sup.Agents.prototype */
            /** 
            * The Agents object acts as a pool of potential objects you configure
            * @class Objects pool
            * @name Sup.Agents 
            **/
        };
    Sup.Agents._debug = function(){}
    
    /**
    * Provides a standard interface for all your agents
    * @class Abstract 
    */
    Sup.Agents.Abstract = function(name){ /** @lends Sup.Agents.Abstract.prototype */
        
        // The name of your action
        this._name = name || "unknown";

        /** Reads the request to set all properties on your agent */
        this.init = function(){
            var request = Sup.Controller.request();
            if ( undefined != request["agents"][this._name]){
                for( var i in request["agents"][this._name] ){
                    this[i] = request["agents"][this._name][i]
                }
            }
        }
        /** Serializes your agent properties and pushes it to controller subscribing a save agent */ 
        this.update = function(do_save){
            var serializable = {};
            for( var i in this){
    //            if ( typeof( this [i] ) == "function" ){
    //                continue;
    //            }
                if ( typeof( i ) == "string" ){
                    if ( i[0] == "_"){
                        continue;
                    }
                }
                serializable[i] = this [i];
            }
            Sup.Controller.requestPart(this._name,serializable);
            if ( do_save ){
                Sup.Controller.save();
            }
        }
    }


    // Strategy
        
    Sup.Strategy = {
            /** 
            * Strategy offers you a way to deal freely with the logic
            * of the profiler, implementing any kind of decision algorithm
            * that will be called by {@link Sup.Controller} at runtime.
            * It returns the {@link Sup.Agents} instanced by {@link Sup.Dispatcher}
            * @class Strategy / Algorithmic decisional
            * @name Sup.Strategy 
            **/
        };
        
    /** Method you configure that implements dispatcher "AI" */
    Sup.Strategy._fn = function(){}
    
    /** AI function executer, performs a selection of agents */
    Sup.Strategy.run = function(){
        return this._fn(Sup.Controller.request());
    }
    
    Sup.Strategy._debug = function(){}

    // Dispatcher

   Sup.Dispatcher = { /** @lends Sup.Dispatcher.prototype */
            /** 
            * Dispatcher is a mechanical part as it receives a list generated 
            * by {@link Sup.Strategy} to instance the {@link Sup.Agents}
            * @class Multi agents handler / Factory  
            * @name Sup.Dispatcher 
            **/
        };
    /** Factories your Agents and records them */
    Sup.Dispatcher.run = function(){
        this._dispatched = {};
        for( var i in this._list ){
            if ( "function" == typeof( this._list[i] ) ){
               var agent = new Sup.Agents.Abstract(i);
               agent.init(Sup.Controller.request())
               agent.run = this._list[i]
               agent.run()
               this._dispatched[i] = agent;
            }
        }
    }

    Sup.Dispatcher._debug = function(){}


    // Controller 
    
    Sup.Controller = { /** @lends Sup.Controller.prototype */
            /** 
            * Contains the request object, loads and saves it for you. The 
            * "request" is 
            * @class IO Controller
            * 
            * @name Sup.Controller 
            **/
            "_request" : {},
            
            /** User rewritable function */
            "write" : function(){}
        };
        

    /** Loads your user data, parses it and sets it as the request */
    Sup.Controller.load = function(){
        Sup.Controller._request = JSON.parse( Sup.Controller.read() );
        if ( undefined == this._request["agents"]){
            this._request["agents"] = {};
        }
    }
    
    /** User rewritten function */
    Sup.Controller.read = function(){}
            
    /** User rewritten function */
    Sup.Controller.write = function(){}
            
    /** Encodes the request and puts it where you asked it to */
    Sup.Controller.save = function(){
        Sup.Controller.write( Sup.Controller.request() );
    }
    
    /** Your basic getter for the request object */
    Sup.Controller.request = function(){
        return Sup.Controller._request;
    };
    
    /** Acts as a getter setter for agents parts of the request */
    Sup.Controller.requestPart = function(part,content){
        // getter
        if ( undefined == content){
            return this._request["agents"][part];
        }
        // setter
        this._request["agents"][part] = content;
    }

    Sup.Controller._debug = function(){
        if ( "function" != typeof( console.log )){
            alert("No console available.");
        }
        console.log("request",this._request);
        for( var i in this._request.agents){
            console.log( "  request agent: "+i);
            for( var ii in this._request.agents[i]){
                if ( "function" != typeof( this._request.agents[i][ii] ) ){
                    console.log( "    "+ii+" ",this._request.agents[i][ii]);
                }
            }
        }
    }
    

  window.Sup = Sup;

})( window );