"use strict";

 /**
 * A module containing common library functions
 * 
 * @module mylib
 * @copyright (c) 2018-2019 Progen Software
 * @version 1.0
 */

// lib namespace object
var mylib = {};

/**
 * This function gets a property from an object of any level of nesting.
 * It is build on top of Javascript's build-in Refect.get() function, which gets the
 * property from any object,where the property has to be at level one. But deepReflectGet(), gets the
 * property value from an object of any level of nesting.
 *  
 * @alias module:mylib.deepReflectGet
 * 
 * @param {object} _oParentObj The target object on which to get the property.
 * 
 * @param {string} _cPropName The name of the property to get from the target object.
 * 
 * @returns {*}  The value of the property depending on the datatype of property.
 * 
 * Function expects _oParentObj to be defined. If not defined, it gives reference error.
 * This function is mostly used to avoid eval on objects with property name as string.
 *  
 * @example
 *  myobj = {};
 * myobj.x = 1;
 * myobj.y = "abc";
 * myobj.z = false;
 * myobj.innerobj = {};
 * myobj.innerobj.p = 11;
 * myobj.innerobj.innermostobj = {};
 * myobj.innerobj.innermostobj.q = "xyz";
 * 
 * mylib.deepReflectGet(myobj,"x")                            // returns 1
 * mylib.deepReflectGet(myobj,"y")                            // returns "abc"
 * mylib.deepReflectGet(myobj,"z")                            // returns false
 * mylib.deepReflectGet(myobj,"innerobj.p")                   // returns 11
 * mylib.deepReflectGet(myobj.innerobj,"p")                   // returns 11
 * mylib.deepReflectGet(myobj,"innerobj.innermostobj.q")      // returns "xyz" 
 * mylib.deepReflectGet(myobj.innerobj",innermostobj.q")      // returns "xyz" 
 * mylib.deepReflectGet(myobj.innerobj.innermostobj,"q")      // returns "xyz" 
 * mylib.deepReflectGet("myobj","x")                          // returns "called on non-object" 
 * mylib.deepReflectGet(myobj,"x1")                           // returns "x1 is not defined "
 * mylib.deepReflectGet(myobj.innerobj,"innermostobj")        // returns "{q : 'xyz'}" 
 * mylib.deepReflectGet(myobj,"innerobj")                     // returns "{p : 11,innermostobj : {q : 'xyz'}}" 
 * 
 * @author Arvind Kumar Kejriwal
 *
 */

mylib.deepReflectGet = function (_oParentObj, _cPropName) {
    //Parameters checking
    if (arguments.length < 2) {
        mylib.showError("mylib.deepReflectGet - Too few arguments.");
        return undefined;

    }
    if (typeof _oParentObj !== "object") {
        mylib.showError("mylib.deepReflectGet called on non-object.");
        return undefined;
    }

    if (typeof _cPropName !== "string") {
        mylib.showError("mylib.deepReflectGet - "+_cPropName+" has to be a string.");
        return undefined;
    }

    let objref = _oParentObj ;
    let _aPropName = _cPropName.split(".");
    let _nProps = _aPropName.length; 
    let _nCtr = 0;
    let nextref = null;
    for ( _nCtr=1; _nCtr < _nProps ; _nCtr++ ) {
        nextref = Reflect.get(objref, _aPropName[_nCtr-1]) ;
        if (typeof nextref !== "object") {
            nextref = objref = null;   
            return null;
        } 
        objref = nextref;
        nextref = null;
    }
     
    let _uResult =  Reflect.get(objref, _aPropName[_nProps-1]) ; 
    nextref = objref = null ;
    return _uResult;
}

/**
 * This function allows you to check if a property belongs to an object. 
 * It is build on top of Javascript's build-in Refect.has() function, which checks if  the
 * property is in the object,but the property has to be at level one. But deepReflectHas(), checks the
 * property belongs to an object,which can be deep in object nesting.
 *  
 * @alias module:mylib.deepReflectHas
 * 
 * @param {object} _oParentObj The target object in which to look for the property.
 * 
 * @param {string} _cPropName The name of the property to check.
 * 
 * @returns {boolean}  A Boolean indicating whether or not the target object has the property.
 * 
 * Function expects _oParentObj to be defined. If not defined, it gives reference error.
 * 
 * @example
 * var myobj = {};
 * myobj.x = 1;
 * myobj.y = "abc";
 * myobj.z = false;
 * myobj.innerobj = {};
 * myobj.innerobj.p = 11;
 * myobj.innerobj.innermostobj = {};
 * myobj.innerobj.innermostobj.q = "xyz";
 * 
 * mylib.deepReflectHas(myobj,"x")                            // returns true
 * mylib.deepReflectHas(myobj,"y")                            // returns true
 * mylib.deepReflectHas(myobj,"z")                            // returns true
 * mylib.deepReflectHas(myobj,"innerobj.p")                   // returns true
 * mylib.deepReflectHas(myobj.innerobj,"p")                   // returns true
 * mylib.deepReflectHas(myobj.innerobj,"innerobj.p")          // returns false
 * mylib.deepReflectHas(myobj,"innerobj.innermostobj.q")      // returns true 
 * mylib.deepReflectHas(myobj.innerobj",innermostobj.q")      // returns true 
 * mylib.deepReflectHas(myobj.innerobj.innermostobj,"q")      // returns true 
 * mylib.deepReflectHas("myobj","x")                          // returns false, "called on non-object" 
 * mylib.deepReflectHas(myobj,"x1")                           // returns false,"x1 not defined "
 * 
 * @author Arvind Kumar Kejriwal
 *
 */

mylib.deepReflectHas = function (_oParentObj, _cPropName) {

    //Parameters checking
    if (arguments.length < 2) {
        mylib.showError("mylib.deepReflectHas - Too few arguments.");
        return false;

    }
    if (typeof _oParentObj !== "object") {
        mylib.showError("mylib.deepReflectHas called on non-object.");
        return false;
    }

    if (typeof _cPropName !== "string") {
        mylib.showError("mylib.deepReflectHas - "+_cPropName+" has to be a string.");
        return false;
    }

    let objref = _oParentObj  ;
    let _aPropName = _cPropName.split(".");
    let _nProps = _aPropName.length; 
    let _nCtr = 0;
    let nextref = null;
    for ( _nCtr=1; _nCtr < _nProps ; _nCtr++ ) {
        nextref = Reflect.get(objref, _aPropName[_nCtr-1]) ;
        if (typeof nextref !== "object") {
            nextref = objref = null;  
            //return null;
            return false;
        } 
        objref = nextref;
        nextref = null;
    }
     
    let _lResult =  Reflect.has(objref, _aPropName[_nProps-1]) ; 
    nextref = objref = null ;
    return _lResult;
}

/**
 * This function allows you to set a property on an object of any level of nesting.
 * It is build on top of Javascript's build-in Refect.set() function, which sets the
 * property of the object,but the property has to be at level one. But deepReflectSet(), sets the
 * property of the object,which can be deep in object nesting.
 *  
 * @alias module:mylib.deepReflectSet
 * 
 * @param {object} _oParentObj The target object on which to set the property.
 * 
 * @param {string} _cPropName The name of the property to set.
 * 
 * @param {*} value  The value to set.
 * 
 * @returns {boolean}  A Boolean indicating whether or not setting the property was successful.
 * 
 * Function expects _oParentObj to be defined. If not defined, it gives reference error.
 *  This function is mostly used to avoid eval on objects with property name as string.
 *  
 * @example
 * var myobj = {};
 * myobj.x = 1;
 * myobj.y = "abc";
 * myobj.z = false;
 * myobj.innerobj = {};
 * myobj.innerobj.p = 11;
 * myobj.innerobj.innermostobj = {};
 * myobj.innerobj.innermostobj.q = "xyz";
 * 
 * mylib.deepReflectSet(myobj,"x",20)                             // returns true
 * mylib.deepReflectSet(myobj,"y","test")                         // returns true
 * mylib.deepReflectSet(myobj,"z",true)                           // returns true
 * mylib.deepReflectSet(myobj,"innerobj.p",100)                   // returns true
 * mylib.deepReflectSet(myobj.innerobj,"p",100)                   // returns true
 * mylib.deepReflectSet(myobj.innerobj,"innerobj.p",100)          // returns false
 * mylib.deepReflectSet(myobj,"innerobj.innermostobj.q",999)      // returns true 
 * mylib.deepReflectSet(myobj.innerobj",innermostobj.q",999)      // returns true 
 * mylib.deepReflectSet(myobj.innerobj.innermostobj,"q",999)      // returns true 
 * mylib.deepReflectSet("myobj","x")                              // returns false, "Too few arguments" 
 * 
 * @author Arvind Kumar Kejriwal
 *
 */

mylib.deepReflectSet = function (_oParentObj, _cPropName, value) {

    //Parameters checking
    if (arguments.length < 3) {
        mylib.showError("mylib.deepReflectSet - Too few arguments.");
        return false;

    }

    if (typeof _oParentObj !== "object") {
        mylib.showError("mylib.deepReflectSet called on non-object.");
        return false;
    }

    if (typeof _cPropName !== "string") {
        mylib.showError("mylib.deepReflectSet - "+_cPropName+" has to be a string.");
        return false;
    }

    let objref = _oParentObj  ;
    let _aPropName = _cPropName.split(".");
    let _nProps = _aPropName.length; 
    let _nCtr = 0;
    let nextref = null;
    for ( _nCtr=1; _nCtr < _nProps ; _nCtr++ ) {
        nextref = Reflect.get(objref, _aPropName[_nCtr-1]) ;
        if (typeof nextref !== "object") {
            nextref = objref = null;   
            //return null;
            return false;
        } 
        objref = nextref;
        nextref = null;
    }
     
    let _lResult =  Reflect.set(objref,_aPropName[_nProps-1], value); 
    nextref = objref = null ;
    return _lResult;
}


/**
 * This function copies the properties from the source object into target object. 
 * This function operates recursively on nested objects. This function preserves 
 * the structure of target object - something which can not be done by JSON.parse(JSON.stringify(srcobj)). 
 * This function ignores the properties which might be in source, but no longer present in target.
 * (This function helps us refresh the object structure whenever it changes, and fix the object data in the table)   
 *  
 * @alias module:mylib.deepObjUpdProperties
 * 
 * @param {object} _oTgtObject The target object on which the source properties are copied.
 * 
 * @param {object} _oSrcObject The source object whose properties are to be copied.
 * 
 * @returns {Boolean}  Boolean true value is returned.
 * 
 * @example
 *  let myobj = {};
 *  myobj.x=1;
 *  myobj.y=false;
 *  myobj.z="abc" 
 *  myobj.innerobj={};
 *  myobj.innerobj.a = 12;
 *  myobj.innerobj.myarry=[{name:"a",value:"99"},{name:"b",value:"66"}]
 *  let tgtobj = {};
 *  tgtobj.x = 0;
 *  tgtobj.y = true;
 *  tgtobj.innerobj={};
 *  tgtobj.innerobj.myarry= [];
 * 
 *  mylib.deepObjUpdProperties(tgtobj,myobj)                     // returns true
 * 
 *  //tgtobj is as follows
 *  tgtobj.x = 1;
 *  tgtobj.y = false;
 *  tgtobj.innerobj.myarry=[{name:"a",value:"99"},{name:"b",value:"66"}]
 * 
 * @author Arvind Kumar Kejriwal
 *
 */

mylib.deepObjUpdProperties = function (_oTgtObject, _oSrcObject) {
    
    //patch - Apr 1, 2019
    if (typeof _oSrcObject == "string" && _oSrcObject.substr(0,1) == "{" && _oSrcObject.substr(_oSrcObject.length-1,1) == "}") {
        // we could have 2 cases :
        // 1. JSON : _cMyStr = '{"x":1, "y":2, "name": "abc"}'
        // 2. quoted object strings :  _cMyStr = '{x:1, y:2, name: "abc"}'
        // 3. object literals in localsql like "{x:1,y:2}"

        // try to convert to object
        //_oSrcObject =   eval("(" + _oSrcObject + ")") // this always works
     
        let _fObjEvalFx = Function('return ' + _oSrcObject);
        _oSrcObject =  _fObjEvalFx();

        // different ways :
        // mylib.evalExpr(_oSrcObject);  // this always works
        // eval("(" + _oSrcObject + ")") // this always works
        // _oSrcObject = JSON.parse(_oSrcObject) ; // this works only with JSON
    } 

    if (typeof _oTgtObject == "object" && typeof _oSrcObject == "object") {
        //for (let _cPropId in _oTgtObject) {
        //    if (_oSrcObject[_cPropId] == undefined) {
        //       continue;
        //    }

        let _cPropId = "";
        // Do not use 'let' in counter initialisation in a loop (eg:-for (let _nCntr = 0; _nCntr < _nStrLen; _nCntr++)), 
        // as for every counter intcrementation 'let' associates new memory allocation.
        // Initialise the counter with 'let' outside the loop.
        for (_cPropId in _oSrcObject) {
            if (_oSrcObject.hasOwnProperty(_cPropId) == false) {
                //skip system properties 
                continue;
            }

// Source Object should be checked instead of Target Object            
//          if (_oTgtObject[_cPropId] == undefined) {
            if (_oSrcObject[_cPropId] == undefined) {
               continue;
            }
            if (_oTgtObject.hasOwnProperty(_cPropId) == false) {
                //skip system properties 
                continue;
            }
        
            if (Array.isArray(_oTgtObject[_cPropId]) && Array.isArray(_oSrcObject[_cPropId])) {
                mylib.deepObjUpdArray(_oTgtObject[_cPropId], _oSrcObject[_cPropId]);
                continue;   
            }
             
            if (typeof _oTgtObject[_cPropId] == "object" && typeof _oSrcObject[_cPropId] == "object") {
               mylib.deepObjUpdProperties(_oTgtObject[_cPropId], _oSrcObject[_cPropId]);
               continue;   //this is important to unwind function call stack
            }


            if (typeof _oTgtObject[_cPropId] != "object" && typeof _oSrcObject[_cPropId] != "object") {
               //update property 
               _oTgtObject[_cPropId] = _oSrcObject[_cPropId];
            }
        } //end for
    }  
    return true;  
};

/**
 * This is a helper function  for deepObjUpdProperties() which copies the properties from the source object 
 * into target object. This function is used if the property of source object is an array.
 * This function operates recursively on nested objects. This function preserves 
 * the structure of target object - something which can not be done by JSON.parse(JSON.stringify(srcobj)). 
 * This function ignores the properties which might be in source, but no longer present in target.
 * (This function helps us refresh the object structure whenever it changes, and fix the object data in the table)   
 *  
 * @alias module:mylib.deepObjUpdArray
 * 
 * @param {object} _oTgtObject The target object on which the source properties are copied.
 * 
 * @param {object} _oSrcObject The source object whose properties are to be copied.
 * 
 * @returns {Boolean}  Boolean true value is returned.
 * 
 * @example
 * let myobj = {};
 * myobj.myarr = ["a",1,{x:8,y:3}];
 * let mytarobj = {};
 * mytarobj.myarr = [];
 * mylib.deepObjUpdProperties(mytarobj.myarr, myobj.myarr);
 * // which internally calls
 * // mylib.deepObjUpdArray(mytarobj.myarr, myobj.myarr) ;
 * //Returns : true
 * 
 * //mytarobj will be as follows:
 * mytarobj = {myarr : ["a",1,{x:8,y:3}]}
 *
 * mytarobj.myarr[2].y = 9;
 * mytarobj = {myarr : ["a",1,{x:8,y:9}]}
 * // It will not change myobj.myarr[2].y
 * 
 * @author Arvind Kumar Kejriwal
 *
 */

 mylib.deepObjUpdArray = function (_oTgtObject, _oSrcObject) {
    let _nArrayLen = _oSrcObject.length;
    _oTgtObject.length = 0;
    let _nCtr = 0;

    // Do not use 'let' in counter initialisation in a loop (eg:-for (let _nCntr = 0; _nCntr < _nStrLen; _nCntr++)), 
    // as for every counter intcrementation 'let' associates new memory allocation.
    // Initialise the counter with 'let' outside the loop.
    for (_nCtr = 1; _nCtr <= _nArrayLen; _nCtr++) {
        if (typeof _oSrcObject[_nCtr-1] == "object") {
            let _oNewObj = JSON.parse(JSON.stringify(_oSrcObject[_nCtr-1])) ;
            mylib.deepObjUpdPrototypes(_oNewObj, _oSrcObject[_nCtr-1]) ;
            _oTgtObject.push(_oNewObj) ;
        } else {
            _oTgtObject.push(_oSrcObject[_nCtr-1]) ;
        }
    } 
    return true ;
} ;   

/**
 * This is a helper function  for deepObjUpdArray() which copies the properties from the source object 
 * into target object. This function copies the prototypes from an authentic source object into target object.
 * This function operates recursively on nested objects.
 * This function adds back / refresh prototypes on an object restored using JSON.parse(JSON.stringify(someobj)) 
 * Caution : do not use on large data sets - use only on appClasses/userClasses objects.
 * This function preserves the structure of target object - something which can
 * not be done by JSON.parse(JSON.stringify(srcobj)). 
 * This function ignores the properties which might be in source, but no longer present in target.
 * (This function helps us refresh the object structure whenever it changes, and fix the object data in the table)   
 *  
 * @alias module:mylib.deepObjUpdPrototypes
 * 
 * @param {object} _oTgtObject The target object on which the source properties are copied.
 * 
 * @param {object} _oSrcObject The source object whose properties are to be copied.
 * 
 * @returns {Boolean}  Boolean true value is returned.
 * 
 * @example
 * let myobj = {};
 * myobj.x = "one";
 * myobj.__proto__.myfxn = function() {console.log(" Hi from my function")};
 * let mytarobj = {};
 * mytarobj.x = "test";
 * mylib.deepObjUpdProperties(mytarobj, myobj);
 * // which internally calls
 * // mylib.deepObjUpdPrototypes(mytarobj,myobj)
 * // Returns : true
 * 
 * //mytarobj will be as follows :
 * mytarobj.x = "one";
 * mytarobj.__proto__ :Object {myfxn: , constructor: ,__defineGetter__: , ...}
 * mytarobj.myfxn()  --> Hi from my function.
 * 
 * @author Arvind Kumar Kejriwal
 *
 */
mylib.deepObjUpdPrototypes = function (_oTgtObject, _oSrcObject) {
    if (typeof _oTgtObject == "object" && typeof _oSrcObject == "object") {
        if (_oSrcObject.constructor.name !== "Object") {
            // firstly, let us attach prototypes back 
            _oTgtObject.__proto__ = _oSrcObject.__proto__;
        }


        //check for nested objects
        let _cPropId = "";
        // Do not use 'let' in counter initialisation in a loop (eg:-for (let _nCntr = 0; _nCntr < _nStrLen; _nCntr++)), 
        // as for every counter intcrementation 'let' associates new memory allocation.
        // Initialise the counter with 'let' outside the loop.
        for (_cPropId in _oTgtObject) {
            if (typeof _oTgtObject[_cPropId] == "object" && typeof _oSrcObject[_cPropId] == "object") {
                mylib.deepObjUpdPrototypes(_oTgtObject[_cPropId], _oSrcObject[_cPropId]);
            }
        } //end for
    }
    return true ;
};

/**
 * This function deallocate the memory associated with the target object and its children. This function
 * works recursively for nested object/arrays. First the innermost object/array is deallocated,then its 
 * parent object/array and so on till target object is reached.
 *  
 * @alias module:mylib.deepObjUpdNull
 * 
 * @param {object} _oTgtObject The target object which is to be made null.
 * 
 * @returns {Boolean}  Boolean true value is returned.
 * 
 * @example
 *  var myobj = {};
 *  myobj.x=1;
 *  myobj.y=false;
 *  myobj.innerobj={};
 *  myobj.innerobj.a = 12;
 *  myobj.innerobj.myarry=[{name:"a",value:"99"},{name:"b",value:"66"}]
 *  myobj.innerobj.innermostobj = {};
 *  myobj.innerobj.innermostobj.a = "hello";
 * 
 *  mylib.deepObjUpdNull(myobj.innerobj)                   // returns true
 * 
 *  //myobj is as follows
 *  myobj = {x:1,y:false,innerobj: {a:12,myarry:[null,null],innermostobj:null}};
 * 
 * mylib.deepObjUpdNull(myobj)                            // returns true
 * 
 * //myobj is as follows
 *  myobj = {x:1,y:false,innerobj: null};
 
 * @author Arvind Kumar Kejriwal
 *
 */


mylib.deepObjUpdNull = function (_oTgtObject) {
    if (typeof _oTgtObject == "object") {
        let _cPropId = "";
        for (_cPropId in _oTgtObject) {
            if (Array.isArray(_oTgtObject[_cPropId])) {
                _oTgtObject[_cPropId] = null;
                continue;   
            }
             
            if (typeof _oTgtObject[_cPropId] == "object") {
               mylib.deepObjUpdNull(_oTgtObject[_cPropId]);
               _oTgtObject[_cPropId] = null;
               continue;   //this is important to unwind function call stack
            }
        } //end for
    }  

    return true;  
};


mylib.getObjLen = function(_oObject) {
    // parameter check.
    if ((arguments.length !== 1) || (typeof _oObject !== "object")) {
        return 0 ;
    }
   
    let _nObjLen = 0 ;
    for (let _cPropId in _oObject) {
        _nObjLen = _nObjLen + 1 ;
    }

    return _nObjLen ;

} ;



mylib.showError = function (_cErrMsg) {
    console.error(_cErrMsg);
} ;

mylib.at = function (_cFindStr, _cTgtString, _nOccurance) {
    // Parameter checking
    if (arguments.length < 2) {
        mylib.showError("mylib.at - Too few arguments.") ;
        return 0 ;
    }

    if (arguments.length > 3) {
        mylib.showError("mylib.at - Too many arguments.") ;
        return 0 ;
    }

    if (typeof _cFindStr !== 'string' || typeof _cTgtString !== 'string') {
        mylib.showError("mylib.at - Invalid function argument value, type, or count.") ;
        return 0 ;
    }

    if ((typeof _nOccurance == 'undefined' || typeof _nOccurance == 'number') == false) {
        mylib.showError("mylib.at - Invalid function argument value, type, or count.") ;
        return 0 ;
    }
    
    if (_cFindStr == "" || _cTgtString == "") {
        return 0 ;
    }

    if (_nOccurance <= 0) {
        return 0 ;
    }
    
    // Set Default value for Occurance
    if (_nOccurance == undefined) {
        _nOccurance = 1 ;
    }

    let _nFindStrLen = _cFindStr.length ;
    let _nCtr        = 0 ;
    let _nFoundPos   = 0 ;

    // Sliced length stored since indexOf() only finds 1st occurance,
    // Hence Target string has to be sliced for each subsequent occurance
    let _nSlicedLen = 0 ;  

    while (true) {
        _nCtr      = _nCtr + 1 ;
        _nFoundPos = _cTgtString.indexOf(_cFindStr) ;

        if (_nFoundPos == -1) {
            return 0 ;
        }

        if (_nCtr == _nOccurance) {
            // Position will include Sliced Length (specially for subsequent occurances)
            return _nFoundPos + _nSlicedLen + 1 ;
        }

        // Slice Target string, for checking of next occurance.
        _cTgtString = _cTgtString.substr(_nFoundPos + _nFindStrLen) ;
        _nSlicedLen = _nSlicedLen + _nFoundPos + _nFindStrLen ;
        
        if (_cTgtString == "") {
            return 0 ;
        }
    }
} ;


mylib.isAllDigit = function (_cStr)
{
    // Check whether String passed contains only digits.
    let _lResult = /(^[0-9]+$)/.test(_cStr) ;
    
    return _lResult ;
} ;

mylib.str2MySqlStr = function (_cStr) {
    if (arguments.length < 1) {
        mylib.showError("mylib.str2MySqlStr - Too few arguments") ;
        return "" ;
    }   
    
    if (arguments.length > 1) {
        mylib.showError("mylib.str2MySqlStr - Too many arguments") ;
        return "" ;
    }   

    if (typeof _cStr !== "string") {
        mylib.showError("mylib.str2MySqlStr - Invalid function argument value,type, or count.") ;
        return "" ;
    }     

    if (_cStr == "") {
        _cStr = "'" + _cStr + "'" ;
        return _cStr ;
    }

    /* Build a pattern to match in the string. Replace chr(0) character,slash,
    Double Quotes with \" and single Quotes with "\'". */
    const _cChr     = String.fromCharCode(0) ;
    const _cQtChr   = '"' ;        
    const _cPattern = "[\\\\'"+_cChr+_cQtChr+"]" ;    
    const _pPattern = new RegExp(_cPattern) ; 
    
    /* If the string is does not contain any of the  characters in the pattern then
    return the string in quotes.*/

    if (_pPattern.test(_cStr) == false) {
        _cStr = "\"" + _cStr + "\"" ;
        return _cStr ;
    }

    /* replace single slash with double slash. Here 2 slashes are put because in JS \ is an escape character
    so to match single slash we need to use double slash.*/ 
    _cStr = _cStr.replace(/\\/g,"\\\\") ;

    // replace Single Quotes with a slash and single quotes
    _cStr = _cStr.replace(/'/g,"\\'") ;

    // replace Double Quotes with slash and double quotes
    _cStr = _cStr.replace(/"/g,'\\"') ;

    // replace chr(0) character with slash and chr(0).
    const _pChrPatrn = new RegExp(String.fromCharCode(0),"g") ;
    _cStr = _cStr.replace(_pChrPatrn, "\\0") ;    
    _cStr = '"' + _cStr + '"' ;    
    return _cStr ;                 
} ;

mylib.strtran = function (_cTgtString, _cOrgStr, _cNewStr, _lIgnCase) {

    // Parameter checking
    if (arguments.length < 3) {
        mylib.showError("mylib.strtran - Too few arguments.") ;
        return "" ;
    }

    if (arguments.length > 4) {
        mylib.showError("mylib.strtran - Too many arguments.") ;
        return "" ;
    }

    if (_lIgnCase == undefined) {
        _lIgnCase = false ;
    }

    if ((typeof _cTgtString !== 'string') || (typeof _cOrgStr !== 'string') || 
        (typeof _cNewStr !== 'string') || (typeof _lIgnCase !== 'boolean')) {
        mylib.showError("mylib.strtran - Invalid function argument value, type, or count.") ;
        return "" ;
    }

    let _nOrgStrPos  = 0  ;
    let _cReplaceStr = "" ;
    let _cTempStr    = _cTgtString ;

    // Start Replacing in a loop
    while (true) {

        // Find the position at which the Original String is Present
        if (_lIgnCase == true) {
            _nOrgStrPos = _cTempStr.toLowerCase().indexOf(_cOrgStr.toLowerCase()) ;
        }
        else {
            _nOrgStrPos = _cTempStr.indexOf(_cOrgStr) ;  // Case-sensitive
        }
       
        // If nothing is remaining to be replaced, concatenate the remaining
        // part of the string to the Replace String.
        if (_nOrgStrPos == -1) {
            _cReplaceStr = _cReplaceStr + _cTempStr ;
            break ;
        }

        // Replace the Original String (part by part)
        _cReplaceStr = _cReplaceStr + _cTempStr.substr(0,_nOrgStrPos) + _cNewStr ;

        // Remove the part of the string that has already been replaced, for further processing
        _cTempStr    = _cTempStr.substr(_nOrgStrPos+_cOrgStr.length) ;
    } // end of While loop

    return _cReplaceStr ;

} ;


mylib.l2Str = function(_lVal) {
    // parameters check.
    if (_lVal == undefined) {
       mylib.showError("mylib.l2Str - Too few arguments.") ;
       return "" ;        
    } 

    if (typeof _lVal !== "boolean") {
       mylib.showError("mylib.l2Str - Invalid function argument value, type or count.") ;
       return "" ;
    }    

    return (_lVal) ? "T" : "F" ;

} ;

mylib.chkDupLst = function (_cList, _cDelim) {
   
    _cDelim = (_cDelim == undefined ? "," : _cDelim) ;

    if (typeof _cList !== "string" || typeof _cDelim !== "string") {                  
        mylib.showError("mylib.chkDupLst - Invalid function argument value,type, or count.") ;
        return false ;
    }   

    if (mylib.empty(_cList)) {
        return false ;
    }
            
    let _aList   = _cList.toLowerCase().split(_cDelim) ;
    let _nElmCnt = _aList.length ;    
    let _nCtr    = 0 ;
    let _nCtr1   = 0 ;

    // Do not use 'let' in counter initialisation in a loop (eg:-for (let _nCntr = 0; _nCntr < _nStrLen; _nCntr++)), 
    // as for every counter intcrementation 'let' associates new memory allocation.
    // Initialise the counter with 'let' outside the loop.
    for ( ; _nCtr <= _nElmCnt; _nCtr++) {         
        for (_nCtr1 = _nCtr+1; _nCtr1 <= _nElmCnt; _nCtr1++) { 
            if (_aList[_nCtr-1] == _aList[_nCtr1-1]) {
                return true ;               
            }
        }              
    }                        
    return false ;
} ;


/**
 * This function converts a number to a string suitable for using in a composite index expression.
 *  
 * @alias module:mylib.convNum2StrIdx 
 * 
 * @param {number} _nFldValue A numeric Field Value which is to be converted to a suitable string format
 * 
 * @param {number} _nFldLen A Numeric Value specifying the length of the Field Value
 * 
 * @param {number} _nDecLen A Numeric Value specifying the Decimal Length of the Field Value
 * 
 * @returns {string} A new string for using in a composite index expression after fixing the
 * numeric Field Value as per the field length and decimal length specified. 
 *  
 * @example
 * let _cNewStr = convNum2StrIdx(123.4 , 10, 3)     // Returns : "   123.400"
 * 
 * 
 * @author Arvind Kumar Kejriwal
 *
 */

mylib.convNum2StrIdx = function (_nFldValue, _nFldLen, _nDecLen) {
    return _nFldValue.toFixed(_nDecLen).padStart(_nFldLen);
}



mylib.evalExpr = function (_cExpr, _cScopeName, _oScope) {
    _cScopeName = (typeof _cScopeName !== "string") ? "_unknownParam" : _cScopeName;
    _oScope = (typeof _oScope !== "object") ? {} : _oScope ; 

    let fx = Function(_cScopeName, 'return ' + _cExpr);
    let _uResult = null;
    try {
        _uResult = fx(_oScope);
    } catch (error) {
        mylib.showError("Error in evalExpr : invalid Expr : " + _cExpr + ", " + error);
    }
   
    fx = null;
    return _uResult;
}


/**
 * This function remove multiple spaces in a string except in a child string token.
 * 
 * @alias module:mylib.StrRemMultiSpace
 * 
 * @param {string} _cStr String whose spaces are to be removed.
 * 
 * @returns {string} A string with multiple spaces removed from it.
 * 
 * @example
 * 
 * let _cStr = "  Hello    world  ";                                  
 * mylib.StrRemMultiSpace(_cStr)                  //Returns "Hello   world"
 * 
 * let _cStr = "Hello     World  'my   friends   '   "
 * mylib.StrRemMultiSpace(_cStr)                  //Returns "Hello World 'my   friends   ' "
 * 
 * 
 * let _cStr = `Hello     World  'my  " lovely,    dear "  friends   '   `
 * mylib.StrRemMultiSpace(_cStr)                  //Returns "Hello World 'my  " lovely,    dear "  friends   ' "
 
 * @author Arvind Kumar Kejriwal
 */

mylib.strRemMultiSpaces = function (_cStr) {
    //remove multiple spaces in a string except in a child string token
    _cStr = _cStr.trim();
    let _nLen        = _cStr.length;
    let _lChQtType1  = false;
    let _lChQtType2  = false;
    let _lChQtType3  = false;
    
    let _lPrevCharWasSpace = false;
    let _cNewStr    = "";
    let _nCtr       = 0;
    

    // Do not use 'let' in counter initialisation in a loop (eg:-for (let _nCntr = 0; _nCntr < _nStrLen; _nCntr++)), 
    // as for every counter intcrementation 'let' associates new memory allocation.
    // Initialise the counter with 'let' outside the loop.
    for (_nCtr = 1; _nCtr <= _nLen; _nCtr++)  {
        if (_cStr[_nCtr-1] == '"' ) {
            _lChQtType1 = (_lChQtType1 == true) ? false : true;
        }

        if (_cStr[_nCtr-1] == "'") {
            _lChQtType2 = (_lChQtType2 == true) ? false : true;
        }

        if (_cStr[_nCtr-1] == "`") {
            _lChQtType3 = (_lChQtType3 == true) ? false : true;
        }

        if (_cStr[_nCtr-1] == " " && _lPrevCharWasSpace == true) {
            //omit this extra space else output in _cNewStr
        } else {
            _cNewStr = _cNewStr + _cStr[_nCtr-1] ;
        }

        //set flag to be used in next loop 
        _lPrevCharWasSpace = (_lChQtType1 == false && _lChQtType2 == false && _lChQtType3 == false && _cStr[_nCtr-1] == " ") ? true : false ;
    }

    return _cNewStr;
};


//Freeze the mylib library to prevent code tampering at runtime
Object.freeze(mylib);


// Export all functions
if (typeof global=="object") {
    //we are in nodejs/vscode environment, so export the module
    module.exports = {mylib:mylib} ;
}
