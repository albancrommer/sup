(function( window, undefined ) {

    /**
    * Sup class
    * @class
    */
    Sup =  
        /**
        * @lends Sup.prototype
        * @minimal
        */
        {};
        
        
    Sup.Strategy = { /** @lends Sup.Strategy.prototype */
            /** 
            * Logical container, content set by user. 
            * @class  Sup.Strategy 
            * @name Sup.Strategy 
            **/
            "_fn" : function(){}
        };
   Sup.Dispatcher = { /** @lends Sup.Dispatcher.prototype */
            /** 
            * Multi agents handler, acts as a factory.
            * @class 
            * @name Sup.Dispatcher 
            **/
            "_list" : {},
            "_dispatched" : {}
        };
   
   Sup.Agents = { /** @lends Sup.Agents.prototype */
            /** 
            * Agents Abstract and list container.
            * @class 
            * @name Sup.Agents 
            **/
            "_list":{}
        };
    
    Sup.Controller = { /** @lends Sup.Controller.prototype */
            /** 
            * IO handler which loads and saves the request
            * @class 
            * 
            * @name Sup.Controller 
            **/
            "_request" : {},
            
            /** User rewritable function */
            "write" : function(){}
        };
        
    /** User land method for setting up the setting while keeping the internals away */
    Sup.configure = function(params){
        Sup.Controller.read = params["read"] || function(){};
        Sup.Controller.write = params["write"] || function(){};
        if( params["strategy"] ){ 
            Sup.Strategy._fn = params["strategy"];
        }
        if( params["agents"] ){ 
            Sup.Agents._list = params["agents"];
        }
        return Sup;
    };
    
    /** User land method for actually starting the system */
    Sup.run = function(){
        Sup.Controller.load();
        Sup.Dispatcher._list = Sup.Strategy.run();
        Sup.Dispatcher.run();
    }

    /** Gets the JSON data from its location and decodes it as request*/
    Sup.Controller.load = function(){
        Sup.Controller._request = Sup.Controller.read();
        if( undefined == this._request["agents"]){
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
    
    /** Acts as a getter setter for actions parts of the request */
    Sup.Controller.requestPart = function(part,content){
        // getter
        if( undefined == content){
            return this._request["agents"][part];
        }
        // setter
        this._request["agents"][part] = content;
    }
    Sup.Controller.requestPart = function(part){
        this._request["agents"][part] = content;
    }
    Sup.Strategy.run = function(){
        return this._fn(Sup.Controller.request());
    }
    Sup.Dispatcher.run = function(){
        for( var i in this._list ){
            if( "function" == typeof( this._list[i] ) ){
               var action = new Sup.Agents.Abstract(i);
               action.init(Sup.Controller.request())
               action.run = this._list[i]
               action.run()
               this._dispatched[i] = action;
            }
        }
    }
    /**
     * @class 
     */
    Sup.Agents.Abstract = function(name){
        this._name = name || "unknown";
        this.init = function(){
            var request = Sup.Controller.request();
            if( undefined != request["agents"][this._name]){
                for( var i in request["agents"][this._name] ){
                    this[i] = request["agents"][this._name][i]
                }
            }
        }
        this.update = function(do_save){
            var serializable = {};
            for( var i in this){
                if( typeof( this [i] ) == "function" ){
                    continue;
                }
                if( typeof( i ) == "string" ){
                    if ( i[0] == "_"){
                        continue;
                    }
                }
                serializable[i] = this [i];
            }
            Sup.Controller.requestPart(this._name,serializable);
            if( do_save ){
                Sup.Controller.save();
            }
        }
    }

  window.Sup = Sup;

})( window );