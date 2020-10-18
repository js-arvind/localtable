"use strict";


(function( context ) {

    /**
     * @fileOverview  LocalTable Class 
     * 
     * We create a flexible, powerful and versatile mechanism for in-memory local tables.
     * 
     * This mechanism allows us to create various higher level mechanisms required for 
     * building large scale complex applications. We can use this mechanism for various 
     * purposes such as follows :
     * 
     * 1. Work tables - these tables allow us to store the form data using the data binding
     *    mechanism provided by the Form Engine. A Form may be quite complex, with one or more
     *    Form Pages. Each Form Page may contain one or more blocks. The Blocks may be Control
     *    Block or Data Block. Each Data Block has an associated work table -  which may be 
     *    either single record or multi-record. The work tables have identical data structures
     *    as the actual tables in RDBMS, where the data would eventually be stored on saving
     *    the Form data. In addition, a work table has several additional columns, which are
     *    needed by the Form Engine to manage the state and the parent-child relationship
     *    between the work tables. These additional columns are as follows:  
     *       w_rectype  C(1) ,
     *       w_recstat  C(1) ,
     *       w_recvalid L ,
     *       w_prntrec  N(6,0) ,
     *       w_recseq   N(6,0) .
     *     
     * 2. Cached Reference tables - these tables enable us to cache various master tables or
     *    look-up tables from RDBMS and use these tables for various purposes such as 
     *    look-ups, autocomplete (popups), code validation and caching system rules and
     *    settings. This mechanism helps us to optimise the application and save round-trips
     *    to the server. These tables can be saved persistently (in IndexedDB) using LocalDb
     *    functionality. Moreover, all records in these tables have a last updated timestamp,
     *    which is used by an incremental update or sync logic (run by service workers) to 
     *    maintain these tables in sync with actual tables in RDBMS.        
     * 
     * 3. Form Update Queue tables - these tables enable us to store Form Data in temporary
     *    queue table, before transmitting the same to the server by service workers. In case,
     *    server is not reachable at any time, the service worker will attempt to update the
     *    pending data present in the Update Queue Table whenever server is available again.       
     * 
     * 4. Query tables - these tables store the data fetched from backend server in response 
     *    to a SQL query and can be used to show the data in query grids, forms, graphs and 
     *    charts.
     * 
     * 5. LocalSql Result tables - these tables are created as a result of LocalSql Select 
     *    operation, which can be run on any Local Table(s). 
     *     
     * We can define and open one or many local tables. We can create a table by calling the
     * constructor of LocalTable Class with a data structure definition array _aStruct. It is
     * an array of JSON tuples, where each tuple describes the structure of one column of the
     * local table. For example: 
     * [{fieldname:"itemcd",datatype:"C",len:15,dec:0}, {fieldname:"itemname",datatype:"C",len:50,dec:0}]
     * The constructor creates a table object which has zero records. We can assign this 
     * table object to any variable, which is then synonymous with the given table. 
     * 
     * The allowed datatypes are : 
     *  1. C - for small Character String (upto 254 chars)
     *  2. M - for large Character String ( > 254 chars)
     *  3. G - for General Fields, which stores any arbitrary data as Utf-8 String
     *  4. N - for numbers
     *  5. D - for dates
     *  6. L - for Logical (boolean)
     *  7. O - for Objects
     *    
     *  The objects can be specified in two different forms :
     *    1. Object Literals such as :  
     *       {fieldname:"userinfo",datatype:"O",len:10,dec:0,objtemplate:{address:{line1:"",line2:"",city:""},regno:"",spllimit:0,allowdisc:false}}
     *    2. Object Class such as : 
     *       {fieldname:"mycircle",datatype:"O",len:10,dec:0,objclassname:"Circle"}
     *
     * We can also update the data structure (schema) of a table by using method
     * modiStru(_aStruct).
     *
     * We can append a blank record in the table by calling method appendBlank() and then
     * simply update the columns by assigning values to them. These updated record columns can
     * be read immediately and used in any expression.
     * 
     * We can get an empty record object representing the structure of a record of the table wherein
     * the various fields are initialised to an empty value for the corresponding datatype of each 
     * field by calling the getEmptyRecord() method.
     * 
     * Any operation which moves the record pointer in the local table will commit the data to the 
     * local table automatically, but if we assign values to the fields of the current record and want 
     * the values to be committed immediately, we can use the commit() method which commits previously 
     * current record of the local table. Normally, in application, we do not need to call commit explicitly,
     * as various methods on localtable automatically call this method internally. It may be needed only
     * in very special cases. 
     * 
     * We can also replace (update) data in several columns by methods such as replacewith(replaceList) and 
     * replaceInto({prop1: value1, prop2: value2}). 
     *
     * We can add a new record and as well as update multiple columns in the new record by 
     * method insertInto({prop1: value1, prop2: value2}). 
     *  
     * We refer to columns (fields) of current record by simply referring to them as
     * tablename.colname.  
     * 
     * A table always has a current record, which can be queried using the method recno(). 
     * A table can have any number of records, which can be queried by method reccount().
     * 
     * We can delete a current record by method delete(). It logically deletes the record
     * by marking it as deleted. However, the record still exists in the table. We can test if
     * a current record is deleted by using method deleted() - which will return true or false.
     * We can un-delete or recall a current record which is deleted using recall().
     *   
     * We can navigate the table by using methods such as goTo(recordNumber), goTop(),
     * goBottom(), skip(numberOfRecs), locate(conditionExpr) etc.
     * 
     * A table has several state attributes which can be queried by methods such as : 
     * bof() - is it beginning of File/Table ? 
     * eof() - is it end of File/Table ? 
     * 
     * We can determine if a record was found or not after a navigation operation such as seek, skip, 
     * locate etc. by using the method found().
     * 
     * Normally, when we navigate a table using any of the above mentioned navigation methods
     * such as skip(_nRecs), goTop(), goBottom(), locate(conditionExpr) etc. except
     * goTo(recnumber), the deleted records will be skipped. However, if we do not wish
     * to skip these deleted records, then we can set a property setdeleted to false by using
     * method setDeletedOff(). We can reset it back to true by using method setDeletedOn().
     * We can query the state of this property by using the method setdeleted(). 
     *
     * We can also apply a filter condition on a table by using method setFilter(filterConditionExpr). 
     * When we set a filter on a table, all navigation operations except goTo(recordNumber) will
     * respect the filter condition. We can clear the filter using method clearFilter(). We can find 
     * the current filter condition by using method filter().
     * 
     * We can update data in several records which satisfy a given condition by method
     * replaceAll(replaceList, separator, conditionExpr). We can also delete several records 
     * which satisfy a given condition by using method deleteAll(conditionExpr). We can also
     * recall several records which satisfy a given condition using method 
     * recallAll(conditionExpr).
     * 
     * We can permanently remove all deleted records from the table by using method pack().
     * Moreover, we can permanently delete all records in a table by using method zap(). 
     *   
     * A table can optionally have one or more indexes. The indexes can be created by using 
     * method indexOn(keyList). The indexes are updated whenever any method moves the current
     * record pointer, thereby commiting the current record. A table always has a current 
     * index order, which may be zero (implying no current index) or a number n which
     * corresponds to the nth index.  We can navigate the table either in physical sequence or
     * in indexed sequence depending on whether a current index has been set to zero or n. 
     * When we index a table, the current index is set to that index. We can also change the 
     * current index using method setOrder(indexNumber). We can find current index sequence or 
     * order by using method curOrder(). We can also re-create all indexes using the method
     * reindex(). The primary use of the index is to seek a record using the index by 
     * method seek(keyValue) - this performs a binary search on the index and quickly finds
     * the record which matches the specified keyValue. The Index keys can be either single
     * column or multi-columns, whose data-type is Character, Numeric or Date.       
     * 
     * An Index can have one or more keys - which may be of different data types. For a multi key
     * index, it is neccessary to build composite index keys in an appropriate fashion with 
     * appropriate padding and data type conversion - so that the index keys are built in an uniform
     * fashion for all records. The method bldIndexExp() is used to return an index expression, 
     * which can be evaluated for each record in a table to build the actual index. This method is
     * used internally by indexOn() method. It is also used by LocalSql library.
     * 
     * Similary, while seeking a record on multi key index, it is necessary to build the key value 
     * string in an appropriate fashion, so that we can search for the given key value string in the
     * index file. The method bldValueExp() is used to return a key value expression, which can be 
     * evaluated for given values of the keys to get a composite keyvalue string. 
     * 
     * There are several other methods related to indexes such as indexKeyList(indexNumber), 
     * setCurIndex(keyList), indexcount(), deleteIndexes() etc.
     * We can use the method indexKeyList(indexNumber) to return the Index Keys list for the specified 
     * index sequence. We can set the current index to an index whose keys correspond to the specified 
     * keys list using the method setCurIndex(keyList). indexcount() can be used to find total number 
     * of indexes defined on the local table and the method deleteindexes() will delete all indexes on 
     * the local table.
     * 
     * We can navigate a table in indexed sequence rather than physical sequence by selecting an index 
     * sequence using setOrder(indexNumber) or setCurIndex(keyList) and then using methods such as skip(), 
     * locate(), goTop(), goBottom() etc.
     *  
     * We can also append another table into an existing local table using appendFromTable().
     * xbGetBookMark() and xbGoToBookMark() are methods used to get the current record number and set
     * the pointer to the specified record number in the specified local table respectively. 
     * 
     * The method setObjectTemplate() will convert a field, which is an existing object, to another 
     * object layout which has either a subset of properties in the specified field or has some 
     * additional properties. setObjectClassName() method will convert a field, which is an existing 
     * object to another object of the specified class.
     *   
     * 
     * 
     * @author Arvind Kumar Kejriwal 
     * @copyright (c) 2018-2019 Progen Software
     * @version 1.0
     * 
     * 
     * 
     * @example
     * 
     * // 1. define table structure
     * let _aStruct = [{fieldname:"itemcd",datatype:"C",len:15,dec:0}, {fieldname:"itemname",datatype:"C",len:50,dec:0}]
     * 
     * // 2. create a blank table
     * let mytable = new LocalTable(_aStruct);
     * 
     * // 3. find the data structure of a table
     * let _aTableStruct = mytable.structdef(); // assigns the data structure to the variable
     *
     * // 4. modify table structure
     * let _aStruct = [{fieldname:"itemcd",datatype:"C",len:15,dec:0}, 
     *                 {fieldname:"itemname",datatype:"C",len:50,dec:0},
     *                 {fieldname:"stock",datatype:"N",len:10,dec:2} ] ;
     * let _lResult = mytable.modiStru(_aStruct);
     * 
     * // 5. append a blank record
     * mytable.appendBlank(); // always return true, thus need not check the result
     * 
     * // 6. assign values to the current record's fields
     * mytable.itemcd = "P001";
     * mytable.itemname = "Paracetamol";
     * mytable.stock = 100;
     *
     * // 7. displays the empty record
     * mytable.getEmptyRecord();    // displays Object {itemcd:"", itemname: "", stock: 0}
     * 
     * // 8. commits the previously current record of the local table. 
     * mytable.commit();
     * 
     * // 9. read values from table field and use it somewhere
     * let item1 = mytable.itemcd ; // assigns "P001" to item1
     * 
     * // 10. replace multiple values on current record using "with" clause
     * let m = {};
     * m.itemcd = "M001";
     * m.itemname = "Metformin" ;
     * m.stock = 200;
     * mytable.appendBlank();
     * mytable.replaceWith(`itemcd with '${m.itemcd}', itemname with '${m.itemname}',stock with ${m.stock}`);
     * 
     * // 11. alternative method to replace values on the current record using fields list and 
     * // values elements list
     * let m = {};
     * m.itemcd = "V001";
     * m.itemname = "Vicks vaporub";
     * m.stock = 300;
     * mytable.appendBlank();
     * mytable.replaceInto({itemcd: m.itemcd, itemname: m.itemname, stock: m.stock});
     *
     * // 12. Insert a new record and update values
     * let m = {};
     * m.itemcd = "C001";
     * m.itemname = "Colgate Toothpaste";
     * m.stock = 400;
     * mytable.insertInto({itemcd: m.itemcd, itemname: m.itemname, stock: m.stock});
     *  
     * // 13. find current record pointer
     * let _nCurRecPtr = mytable.recno(); // it should be 4
     * 
     * // 14. find total record count
     * let _nTotRecCount = mytable.reccount(); // it should be 4
     * 
     * // 15. mark a current record as deleted
     * mytable.delete(); // deletes the current record - i.e. the 4th record
     * 
     * // 16. check if a current record is deleted
     * let _lIsDeleted = mytable.deleted(); // _lIsDeleted should be true
     * 
     * // 17. Go to 2nd Record and update the stock
     * let _lResult = mytable.goTo(2); 
     * mytable.stock = 201;
     * 
     * // 18. go to topmost record
     * mytable.goTop();  // the current record pointer should be 1 now 
     * 
     * // 19. go to last record
     * mytable.goBottom(); // the current record pointer will be 3 now, as 4th record is deleted
     *    
     * // 20. skip backward relative to current pointer
     * mytable.skip(-1); // goes to 2nd record 
     *
     * // 21. skip forward relative to current pointer
     * mytable.skip(1); // goes to 3rd record
     * 
     * // 22. locate a record satisfying a condition
     * let _lResult = mytable.locate("itemcd == 'V001' "); // _lResult should be true
     * 
     * // 23. try to locate a non-existent record
     * let _lResult = mytable.locate("itemcd == 'X001' "); // _lResult should be false 
     *  
     * // 24. determine if a record was found by last navigation operation
     * let _lFound = mytable.found(); // _lFound should be false, as last locate did not find any record
     *
     * // 25. find if the current record pointer is at end of file ?
     * let _lIsEof = mytable.eof(); // it should be true 
     * 
     * // 26. going prior to first record - it leads to bof becoming true
     * mytable.goTop();   // the current record pointer goes to first record
     * mytable.skip(-1) ; // try to move prior to this record
     * let _lIsBof = mytable.bof(); // the _lIsBof should be true
     * 
     * // 27. going beyond last record - it leads to eof becoming true
     * mytable.goBottom(); // the current record pointer goes to 3rd record as 4th is deleted
     * let _nCurRecPtr = mytable.recno(); // the current record number will be 3 now
     * mytable.skip(1) ;  // try to move to next record
     * let _lIsEof = mytable.eof(); // the _lIsEof should be true
     * 
     * // 28. go to Record No. 4 - if will be success, even though the record is marked as deleted
     * let _lResult = mytable.goTo(4); // _lResult will be true
     * 
     * // 29. change the setdeleted attribute of the table to false and then see how 
     * // goBottom() works
     * mytable.goTo(1); // since we are at 4th record, go to 1st record  
     * mytable.setDeletedOff(); // we are telling the system to not bypass deleted records 
     * let _lResult = mytable.goBottom(); // go to bottom most record in the table
     * let _nCurRecPtr = mytable.recno(); // the current record number will be 4 now
     * 
     * // 30. query the setdeleted attribute of the table
     * let _lSetDeleted = mytable.setdeleted(); // it should be false right now 
     * 
     * // 31. re-set the setdeleted attribute to true
     * mytable.setDeletedOn();
     * 
     * // 32. set filter condition on the table
     * mytable.setFilter("stock > 0"); // sets filter to records where stock > 0
     * 
     * // 33. Find the current filter condition 
     * let _cFilterCondExpr = mytable.filter(); // will return "stock > 0" 
     *
     * // 34. clear an existing filter on the table
     * mytable.clearFilter();
     *
     * // 35. recall or un-delete the 4th record which is currently deleted
     * mytable.goTo(4);
     * mytable.recall();
     *
     * // 36. replace one or multiple values on many records which meet a condition
     * mytable.replaceAll("stock with stock - 10", ",", "stock > 10"); // reduce stock by 10 where stock is > 10
     * 
     * // 37. delete all records which satisfy a given condition
     * mytable.deleteAll("stock == 0"); // deletes all records with nil stock
     * mytable.deleteAll(); // deletes all records
     * 
     * // 38. recall all records which satisfy a given condition
     * mytable.recallAll("stock == 0") ; // recalls all records with nil stock
     * mytable.recallAll() ; // recalls all deleted records
     * 
     * // 39. permamnently remove the deleted records - i.e. pack the table
     * mytable.pack();
     * 
     * // 40. permanently delete all records in a table
     * mytable.zap();
     * 
     * // 41. create an index
     * mytable.indexOn("itemcd"); // indexes all records on itemcd column
     * 
     * // 42. seek a record using character value key
     * m.itemcd = "V001";
     * let _lResult = mytable.seek(m.itemcd); // finds the record using index on itemcd column
     * 
     * // 43. create another index
     * mytable.indexOn("stock"); // creates 2nd index on stock column
     * 
     * // 44. check current index order
     * let _nCurIndxSeq = mytable.curOrder(); // returns 2
     *  
     * // 45. access record using numeric key
     * m.stock = 100;
     * let _lResult = mytable.seek(m.stock); // finds the record using index on stock column
     * 
     * // 46. create a composite index (using one character column and one numeric column)
     * mytable.indexOn("itemcd,stock"); // creates 3rd index (composite index)
     * 
     * // 47. check index keys
     * let _cKeysList = mytable.indexkeylist(3); // return a keys list -> "itemcd,stock"    
     * 
     * // 48. set current index using indexnumber 
     * mytable.setOrder(2);  // set current index to 2nd index which is on stock column
     *
     * // 49. set current index using keylist 
     * mytable.setCurIndex("itemcd,stock");
     * 
     * // 50. seek record using composite keys
     * let m = {};
     * m.itemcd = "C001";
     * m.stock = 400;  
     * 
     * // build an index expression using specified keys
     * let _cKeyValueExp = mytable.bldIndexExp("itemcd,stock", "thisrecord") ; 
     * 
     * // build a key value expression using the index expression template 
     * let _cKeyValueExp = mytable.bldValueExp("itemcd,stock", "m.itemcd,m.stock"); 
     * 
     * // get the properly padded key value by evaling the key value expression  
     * let _cKeyValue = eval(_cKeyValueExp); 
     * 
     * // find the record using composite keys
     * let _lResult = mytable.seek(_cKeyValue); 
     * 
     * // 51. find total number of indexes on a table
     * let _nTotIndx = mytable.indexcount();
     * 
     * // 52. uploading data without updating indexes and then reindex all indexes
     * mytable.setOrder(-1); // if current index seq is -1, the system will not update indexes as we update data 
     * mytable.insertInto({itemcd: m.itemcd, itemname: m.itemname, stock: m.stock});  // we can do many inserts like this
     *
     * // do several inserts similar to above and then reindex
     * mytable.reindex(); // reindex the table after having done all inserts
     * 
     * // 53. delete all indexes
     * let _lResult = mytable.deleteIndexes();  
     * 
     * // 54. append data from another table
     * let _aTableStruct = mytable.structdef(); // assigns the data structure to the variable
     * let newtable = new LocalTable(_aTableStruct); // creates a new table
     * newtable.appendFromTable(mytable);   // append data in newtable from mytable
     * 
     * // 55. get the current record number
     * let _nBookMark = mytable.xbGetBookMark() ;
     * 
     * // 56. go to the specified record number
     * mytable.xbGoToBookMark(5) ;
     * 
     * 
     * // 57. Convert a field, which is an existing object to another object layout
     * mytable.setObjectTemplate("mycircle", { point: { x: 1, y: 2 }, r: 10 });
     *
     * // 58. Convert a field, which is an existing object to another object of the specified class.   
     *  mytable.setObjectClassName("mycircle", "appClasses.Circle");
     * 
     * 
     */



    /**
     * Creates a new LocalTable (in-memory local table) Instance with specified data structure.
     * 
     * We can define and open one or many local tables.  We can create a table by calling the
     * constructor of LocalTable Class with a data structure definition array _aStruct. It is
     * an array of JSON tuples, where each tuple describes the structure of one column of the
     * local table. For example: 
     * [{fieldname:"itemcd",datatype:"C",len:15,dec:0}, 
     *  {fieldname:"itemname",datatype:"C",len:50,dec:0}]
     * 
     * The constructor creates a table object which has zero records. We can assign this 
     * table object to any variable, which is then synonymous with the given table. 
     * 
     * @constructor
     * 
     * @version 1.0
     *
     * @param {array} _aStruct A data structure definition array _aStruct. It is an array of
     * JSON tuples, where each tuple describes the structure of one column of the local table.
     * For example :
     * [{fieldname:"itemcd",datatype:"C",len:15,dec:0},
     *  {fieldname:"itemname",datatype:"C",len:50,dec:0}]
     *
     * The allowed datatypes are : 
     *  1. C - for small Character String (upto 254 chars)
     *  2. M - for large Character String ( > 254 chars)
     *  3. G - for General Fields, which stores any arbitrary data as Utf-8 String
     *  4. N - for numbers
     *  5. D - for dates
     *  6. L - for Logical (boolean)
     *  7. O - for Objects   
     * 
     *  The objects can be specified in two different forms :
     *    1. Object Literals such as :  
     *       {fieldname:"userinfo",datatype:"O",len:10,dec:0,objtemplate:{address:{line1:"",line2:"",city:""},regno:"",spllimit:0,allowdisc:false}}
     *    2. Object Class such as : 
     *       {fieldname:"mycircle",datatype:"O",len:10,dec:0,objclassname:"Circle"}
     * 
     * @returns {object} The local table object.
     * 
     * @example 
     * // define table structure
     * let _aStruct = [{fieldname:"itemcd",datatype:"C",len:15,dec:0}, {fieldname:"itemname",datatype:"C",len:50,dec:0}];
     * // create a blank table
     * let mytable = new LocalTable(_aStruct);
     */


    var LocalTable = function (_aStruct) {
        if (_aStruct == undefined || _aStruct == "") {
            _aStruct = [{fieldname:"dumfld",datatype:"C",len:10,dec:0}];
            // mylib.showError("Table structure is not specified");
            // return {};
        }

        if (_aStruct.length == 0) {
            mylib.showError("Table structure length is 0");
            return {};
        }

        // auto-instantiation
        if (!(this instanceof LocalTable)) {
            return new LocalTable(_aStruct);
        }

        // get the table structure 
        let  _orgstruct = getTableStruct(_aStruct);

        // Flatten the struct and attach embeded object's class prototypes back
        let _newstruct = JSON.parse(JSON.stringify(_orgstruct));
        let _cPropId = null;
        for (_cPropId in _orgstruct) {
            if (typeof _orgstruct[_cPropId] == "object") {
                // attach prototypes on this object, so that all methods are readily available on the object
                mylib.deepObjUpdPrototypes(_newstruct[_cPropId], _orgstruct[_cPropId]);
            } 
        } // end for

        // kill _orgstruct
        _orgstruct = null; 

        // create the table object 
        // this._astructdef = _aStruct; // structure definition array
        // this._struct = _newstruct;   // actual empty stucture object
        // this._reccount = 0;          // record count of table at any time
        // this._recno = 1;             // current record number at any time
        // this._bof = false;           // bof property at any time
        // this._eof = true;            // eof property at any time 
        // this._setdeleted = true;     // setdeleted property at any time -  true (if set deleted on) or false (if set deleted off)
        // this._filtercond = "";       // current filter condition if any (a logical expression expressed using table's fields, comparision or relational operators, constants and literal values)
        // this._curorder = 0;          // current index order 
        // this._indexcount = 0;        // Total Indexes defined on this table
        // this._indexdef = [];         // array of index definition objects of form {indexkeyexp:"somekeyexp"}  
        // this._indexdata = [];        // array of all index tables - each index table in turn is an array of {indexval: "somevalue", recno: actual_record_no } 
        // this._table = [];            // actual table data - array of record objects 

        // We also inject empty fields from _struct into upper layer of the table object. This
        // helps us refer to any field in current record easily. For Example, we can refer to
        // a field of current record as say invhd.custcd rather than saying 
        // invhd._table[invhd.recno()].custcd
        //
        // Please also note that _struct also contains _deleted property, so the upper layer 
        // will contain a deleted property also, though it may not be obvious at first glance.
        // 
        // When we update the data, it is first updated in the upper layer, and then committed
        // to actual table (ie. this._table), whenever any operation which could move the 
        // current record pointer happens. At this time, not only the data from upper layer 
        // but also the _deleted property is committed to this._table.
        //   
        // Moreover, whenever the record pointer changes due to goTo, goTop, goBottom, skip, 
        // locate, seek etc, we update all fields of selected record in upper layer 
        // automatically from the corresponding record in this._table. At this time, the
        // _deleted property of that record is also updated.  
        //
        // We inject empty structure _newstruct at end again into upper layer in the following code
        
        // Optimised for flat shape
        Object.assign(this, { _astructdef:_aStruct, _struct: _newstruct,
                            _reccount:0, _recno:1, _bof:false, _eof:true, 
                            _setdeleted:true, _filtercond:"",
                            _curorder:0, _indexcount:0, 
                            _indexdef:[], _indexdata:[], 
                            _table:[] },          
                            _newstruct);

        return this;  // here we return a new empty table object
    } ;


    // private function to develop structure of a table along with its deleted property
    const getTableStruct = function (_aStruct) {

        let _nStruLen = _aStruct.length;
        let _oFldStru = {};
        let _orgstruct = {};
        let _cPropId = "";
        let _cDataType = "";

        // we first create an empty structure in _orgstruct based on the structure definition array (_aStruct)
        // passed to the constructor 
        let _nCtr = 0;
        for (_nCtr = 0; _nCtr <= _nStruLen - 1; _nCtr++) {
            _oFldStru = _aStruct[_nCtr];

            // An individual element of the structure definition array (_aStruct) specifies  
            // one field. example : _oFldStru = {fieldname:"itemcd",datatype:"C",len:15,dec:0}

            // The len and dec properties are primarily used for indexing in proper manner, as
            // json is free-format, it has no direct use in data structure
            // 
            // An actual empty _orgstruct should be like : {itemcd:"",qty:0,mydate:"0000-00-00",isregd:false,itemdes:""}

            // The stucture can also specify objects in two different forms :
            // 1. Object Literals such as :  
            //    {fieldname:"userinfo",datatype:"O",len:10,dec:0,objtemplate:{address:{line1:"",line2:"",city:""},regno:"",spllimit:0,allowdisc:false}},
            // 2. Object Class such as : 
            //    {fieldname:"mycircle",datatype:"O",len:10,dec:0,objclassname:"Circle"},

            _cPropId = _oFldStru.fieldname.trim();
            _cDataType = _oFldStru.datatype.trim().toUpperCase();

            if (_cDataType == "C" || _cDataType == "M" || _cDataType == "G") {
                _orgstruct[_cPropId] = "";
                continue;
            }

            if (_cDataType == "N") {
                _orgstruct[_cPropId] = 0;
                continue;
            }

            if (_cDataType == "D") {
                _orgstruct[_cPropId] = "0000-00-00";
                continue;
            }

            if (_cDataType == "L") {
                _orgstruct[_cPropId] = false;
                continue;
            }

            if (_cDataType == "O") {
                if (_oFldStru.objclassname !== undefined && _oFldStru.objclassname !== "") {
                    let _cNewObjConst = "new " + _oFldStru.objclassname.trim() + "()";

                    try {
                        // _orgstruct[_cPropId] = eval(_cNewObjConst);
                        let _fObjEvalFx = Function('return ' + _cNewObjConst);
                        _orgstruct[_cPropId] = _fObjEvalFx();
                    } catch (error) {
                        mylib.showError("LocalTable Constructor - Error while evaluating Object Class, " + error); 
                    }
                    
                    continue;
                }

                if (_oFldStru.objtemplate !== undefined && _oFldStru.objtemplate !== "") {
                    // simple full deep object clone 
                    try {
                        _orgstruct[_cPropId] = JSON.parse(JSON.stringify(_oFldStru.objtemplate));
                    } catch (error) {
                        mylib.showError("LocalTable Constructor - Error while parsing object's  template json, " + error); 
                    }
            
                    continue;
                }

                // else create an empty object  
                _orgstruct[_cPropId] = {};
                continue;
            }

        } // end for

        // add an additional property called _deleted  to _orgstruct
        _orgstruct._deleted = false;
        return _orgstruct;
    };



    /**
     * A method which returns the data structure property of the local table.
     *  
     *
     * @returns {object} A data structure definition array _aStruct. It is an array of JSON 
     * tuples, where each tuple describes the structure of one column of the local table. 
     * For example:
     * [{fieldname:"itemcd",datatype:"C",len:15,dec:0}, {fieldname:"itemname",datatype:"C",len:50,dec:0}]
     * 
     * @example
     * // find the data structure property of a local table
     * let _aTableStruct = mytable.structdef() // assigns the data structure to the variable
     */
    LocalTable.prototype.structdef = function () { return this._astructdef; } ;


    /**
     * A method to modify the data structure of the local table.
     * 
     * @param {object} _aStruct A data structure definition array _aStruct. It is an array 
     * of JSON tuples, where each tuple describes the structure of one column of the local 
     * table. For example :
     * [{fieldname:"itemcd",datatype:"C",len:15,dec:0}, {fieldname:"itemname",datatype:"C",len:50,dec:0}]
     *
     * @returns {boolean} The result of the method as true or false.  
     * 
     * @example
     * // modify table structure
     * let _aStruct = [{fieldname:"itemcd",datatype:"C",len:15,dec:0}, 
     *                 {fieldname:"itemname",datatype:"C",len:50,dec:0},
     *                 {fieldname:"stock",datatype:"N",len:10,dec:2} ];
     * let _lResult = mytable.modiStru(_aStruct);
     *
     */
    LocalTable.prototype.modiStru = function (_aStruct) {
        if (_aStruct == undefined || _aStruct == "") {
            mylib.showError("Table structure is not specified");
            return false;
        }

        if (_aStruct.length == 0) {
            mylib.showError("Table structure length is 0");
            return false;
        }

        // commit the current record and update existing indexes
        this.commit();

        // get the table's new  structure 
        let  _orgstruct = getTableStruct(_aStruct);

        // Flatten the struct and attach embeded object's class prototypes back
        let _newstruct = JSON.parse(JSON.stringify(_orgstruct));
        let _cPropId = null;
        for (_cPropId in _orgstruct) {
            if (typeof _orgstruct[_cPropId] == "object") {
                // attach prototypes on this object, so that all methods are readily available on the object
                mylib.deepObjUpdPrototypes(_newstruct[_cPropId], _orgstruct[_cPropId]);
            } 
        } // end for

        // kill _orgstruct
        _orgstruct = null; 

        // keep a copy of old structure
        let _oldstruct =  this._struct;

        // update the table object 
        this._astructdef = _aStruct;     // structure  definition
        this._struct = _newstruct;       // actual empty stucture object

        // update the empty field  and objects in upper layer
        // The important reason why we do this is to refresh the upper layer with 
        // latest data types for fields and latest objects methods
        // we can not do Object.assign(this,this._struct) , bcuz it won't copy embedded
        // objects cleanly, and old values inside deeply embedded objects will linger 
        for (_cPropId in this._struct) {
            if (typeof this._struct[_cPropId] == "object") {
                // copy object in safe manner 
                this[_cPropId] = JSON.parse(JSON.stringify(this._struct[_cPropId]));
                // attach prototypes on this object, so that all methods are readily available on the object
                mylib.deepObjUpdPrototypes(this[_cPropId], this._struct[_cPropId]);
            } else {
                this[_cPropId] = this._struct[_cPropId];
            }
        } // end for
    

        // Now the upper layer fields have updated properties
        // patch to delete a field from upper layer which is no longer in  structure
        for (_cPropId in _oldstruct) {
            // TODO - check
            //  typeof this._struct[_cPropId] === "undefined"
            //  this._struct[_cPropId] === undefined
            //  this._struct[_cPropId] == null

            if (typeof this._struct[_cPropId] == "undefined") {
                try {
                    delete this[_cPropId];
                } catch (error) {
                    mylib.showError("modi stru - Error while deleting old field, " + error); 
                }
            }    
        }

        // Go to Top of Table using current Index, but do not do commit again
        this.goTop(true);

        return true;
    } ;


    /**
     * This method appends a blank record to the local table.
     * 
     * @returns {boolean} This method always returns true.
     * 
     * @example
     * // append a blank record
     * mytable.appendBlank(); // always returns true, thus need not check the result
     * 
     * // then we can assign values to the current record's fields
     * mytable.itemcd = "P001";
     * mytable.itemname = "Paracetamol" ;
     * mytable.stock = 100;
     *
     * // we can read values from table field and use it somewhere
     * let item1 = mytable.itemcd;  // assigns "P001" to item1
     */

    LocalTable.prototype.appendBlank = function () {
        // commit previously current record into this._table   
        this.commit();

        // append a blank record 
        this._reccount++;
        this._recno = this._reccount;
        this._bof = false;
        this._eof = false;

    
        // inject empty structure's fields into upper layer 
        // we can not do Object.assign(this,this._struct) , bcuz it won't copy embedded
        // objects cleanly, and old values inside deeply embedded objects will linger 
        let _cPropId = null;
        for (_cPropId in this._struct) {
            if (typeof this._struct[_cPropId] == "object") {
                // copy object in safe manner 
                this[_cPropId] = JSON.parse(JSON.stringify(this._struct[_cPropId]));
                // attach prototypes on this object, so that all methods are readily available on the object
                mylib.deepObjUpdPrototypes(this[_cPropId], this._struct[_cPropId]);
            } else {
                this[_cPropId] = this._struct[_cPropId];
            }
        } // end for
    
   
        // commit the newly added current record into this._table to create a blank record, but need not update indexes as data is blank so far
        this.commit(true);
        return true;
    } ;


    /**
     * This method returns an empty record object for the local table.
     * The various fields are initialised to an empty value for the corresponding
     * datatype of each property.
     * 
     * This method is useful when we need an object representing the structure of a record
     * of the local table.
     * 
     * @returns {object} This method returns the empty record object of the table.
     * 
     * @example
     * // displays the empty record
     * mytable.getEmptyRecord();    // displays Object {empno:"", salary: 0, birthdt: "0000:00:00"}
     * 
     */

    LocalTable.prototype.getEmptyRecord = function () {
        return JSON.parse(JSON.stringify(this._struct)) ;

        let emptyRecord = {};

        // update record row in table
        let _cPropId = null;
        for (_cPropId in this._struct) {
            emptyRecord[_cPropId] = this[_cPropId];
        } // end for

        return emptyRecord;
    } ;


    /**
     * This method commits previously current record of the local table. 
     * 
     * Any operation which moves the record pointer in the local table will commit the data to the 
     * local table automatically. But if we assign values to the fields of the current record and 
     * want the value to be committed immediately, we can use this method.
     * 
     * Normally, in application, we do not need to call commit explicitly, as various methods on 
     * local table automatically call this method internally. It may be needed only in very special cases. 
     * 
     * @param {boolean} [_lNoUpdIndex=false] is an optional logical value which is to be passed as
     * true if indexes on the local table are to be updated after the commit. It is false by default.
     * 
     * @returns {boolean} This method returns true if record is committed successfully. It returns false if
     * there is no record in the table to commit.
     * 
     * @example
     * // commits the record
     * mytable.commit(); 
     * 
     */

    // Private function
    LocalTable.prototype.commit = function (_lNoUpdIndex) {
        if (this._recno > 0 && this._recno <= this._reccount && this.eof() == false) {
            // commit current record into this._table

            // store oldrecord in a variable
            let oldrecord = this._table[this._recno - 1];

            // init the record row in table, so that we copy it cleanly from current record
            // give it right shape at first instance 
            // this._table[this._recno - 1] = {};
            this._table[this._recno - 1] = JSON.parse(JSON.stringify(this._struct));
    
            // update record row in table
            let _cPropId = null;
            for (_cPropId in this._struct) {
                if (typeof this[_cPropId] == "object") {
                    // copy object contents 
                    this._table[this._recno - 1][_cPropId] = JSON.parse(JSON.stringify(this[_cPropId]));
                    // Note: we don't copy object's methods (__proto__) back in each record, as it will be waste of resources
                } else {
                    this._table[this._recno - 1][_cPropId] = this[_cPropId];
                }
            } // end for

            if (this._indexcount == 0) {
                return true;
            }
            
            if (_lNoUpdIndex == true) {
                return true;
            }

            // spl. logic - if _curorder is -1, do not update indexes
            if (this._curorder == -1) {
                return true;
            }


            // Update indexes one by one.
            // When we add a record, it is added to each index and the index is re-sorted.
            // Re-sorting is required because it is not a btree index.
            //
            // Thus, while this operation may be ok for appending/updating one record at a 
            // time, but if we are doing bulk insert, we should do that without any indexes
            // first and then build the index. Alternatively, we can setOrder(-1), and then 
            // do bulk insert and then reindex the table.  
            let newrecord = this._table[this._recno - 1];
            let _cIndexKeyExp = "";
            let _fIndexEvalFx = null;
            let _uIndexVal = "";
            let _uOldIndexVal = "";
            let _aIndexData = [];
            let _nIndexLen = 0;
            let thisrecord = {};
            let _nCtr = 0;
            for (_nCtr = 1; _nCtr <= this._indexcount; _nCtr++) {
                // For a Given Index
                // get its index expression
                _cIndexKeyExp = this._indexdef[_nCtr - 1].indexkeyexp;

                // get its index evaluator fx
                _fIndexEvalFx = this._indexdef[_nCtr - 1].indexevalfx ;
                
                // find the new index key value 
                thisrecord = newrecord;
                //_uIndexVal = eval(_cIndexKeyExp);
                _uIndexVal = _fIndexEvalFx(thisrecord);


                // following may not be needed now as the index expression has uppercase conversion built in
                if (typeof _uIndexVal == "string") {
                    _uIndexVal = _uIndexVal.toUpperCase();  
                }

                // create a reference to index data array
                _aIndexData = this._indexdata[_nCtr - 1];
                _nIndexLen = _aIndexData.length;

                if (this._recno > _nIndexLen) {
                    // this is a newly added record
                    // create a new index entry
                    _aIndexData[_nIndexLen] = { indexval: _uIndexVal, recno: this._recno };
                } else {
                    // find old index key value, see if it has changed
                    thisrecord = oldrecord;
                    // _uOldIndexVal = eval(_cIndexKeyExp);
                    _uOldIndexVal = _fIndexEvalFx(thisrecord);

                    if (typeof _uOldIndexVal == "string") {
                        _uOldIndexVal = _uOldIndexVal.toUpperCase();
                    }

                    if (_uOldIndexVal == _uIndexVal) {
                        continue; // need not update this index, go to next  
                    }

                    // find the index record for this._recno
                    // this is a  costly operation on large data set
                    // but we have no other choice , unless we use a hashkey concept for 
                    // locating index key entry for a given record number
                    let _nIndxEnt = 0; // zero relative
                    _nIndxEnt = _aIndexData.findIndex(myobj => myobj.recno == this._recno);
                    if (_nIndxEnt == -1) {
                        // could not find an index entry, actually this should never actually happen on existing record
                        // anyway, create a new index entry
                        mylib.showError("unexpected : could not find an index entry for existing record during commit");
                        debugger;
                        _aIndexData[_nIndexLen] = { indexval: _uIndexVal, recno: this._recno };
                    } else {
                        _aIndexData[_nIndxEnt].indexval = _uIndexVal;
                    }
                }

                // Now, sort the data on indexval
                _aIndexData.sort(function (a, b) {
                    // return a.indexval > b.indexval ? 1 : -1;
                    return a.indexval > b.indexval ? 1 : a.indexval < b.indexval ? -1 : a.recno < b.recno ? -1 : 1 ;
                });

            }  // endfor

            return true;
        }  // endif  

        // no current record, nothing to commit
        return false;
    };


    // Private function
    // prefixes "thisrecord." to any element of the given expression , if that element is a 
    // property of this table
    LocalTable.prototype.reformCondition = function (_cCondExpr,_cCntxAlias) {
        // we need to tokenize _cCondExpr
        // eg. qty > 100 && rate > 0
        // ["qty", ">" , "100", "&&" , "rate", ">", "0" ]

        // _cCondExpr = "qty > 0 || (qty2*qty3-qty4+qty5/qty6%qty7++qty8--qty9!qty10(qty11)*[qty12]==qty13!=qty14===qty15!==qty16<qty17<=qty18>qty19>=qty20||qty21&&qty22 == '   ' )";

        // if there is one space, make it two spaces - so that one space acts as split seperator
        // and other space is add to array token (which will be added back to reformed string) 
        // _cCondExpr =  _cCondExpr.replace(/\s{1}/g, "  ") ;

        if (_cCntxAlias == undefined || _cCntxAlias =="" ) {
            _cCntxAlias = "thisrecord" ;
        }

        // inject a space before and after each operator and parentheses 
        _cCondExpr = _cCondExpr.replace(/\+/g, " + ");
        _cCondExpr = _cCondExpr.replace(/-/g, " - ");
        _cCondExpr = _cCondExpr.replace(/\*/g, " * ");
        _cCondExpr = _cCondExpr.replace(/\//g, " / ");
        _cCondExpr = _cCondExpr.replace(/%/g, " % ");
        _cCondExpr = _cCondExpr.replace(/\!/g, " ! ");
        _cCondExpr = _cCondExpr.replace(/\=/g, " = ");
        _cCondExpr = _cCondExpr.replace(/</g, " < ");
        _cCondExpr = _cCondExpr.replace(/>/g, " > ");
        _cCondExpr = _cCondExpr.replace(/\|{2}/g, " || ");
        _cCondExpr = _cCondExpr.replace(/&{2}/g, " && ");
        _cCondExpr = _cCondExpr.replace(/\(/g, " ( ");
        _cCondExpr = _cCondExpr.replace(/\)/g, " ) ");
        _cCondExpr = _cCondExpr.replace(/\[/g, " [ ");
        _cCondExpr = _cCondExpr.replace(/\]/g, " ] ");
        _cCondExpr = _cCondExpr.replace(/\,/g, " , ");
        _cCondExpr = _cCondExpr.replace(/\?/g, " ? ");
        _cCondExpr = _cCondExpr.replace(/\:/g, " : ");

        // Now we have a space before and after all operators and parentheses etc.
        // However, now some operators such as ++, --, ==, ===, !=, !==,  <= and >= would have 
        // also been spaced out. Now, we normalize such operators. 
        _cCondExpr = _cCondExpr.replace(/\+{1}\s{2}\+{1}/g, "++");
        _cCondExpr = _cCondExpr.replace(/\-{1}\s{2}\-{1}/g, "--");
        _cCondExpr = _cCondExpr.replace(/\={1}\s{2}\={1}\s{2}\={1}/g, "===");
        _cCondExpr = _cCondExpr.replace(/\!{1}\s{2}\={1}\s{2}\={1}/g, "!==");
        _cCondExpr = _cCondExpr.replace(/\={1}\s{2}\={1}/g, "==");
        _cCondExpr = _cCondExpr.replace(/\!{1}\s{2}\={1}/g, "!=");
        _cCondExpr = _cCondExpr.replace(/\<{1}\s{2}\={1}/g, "<=");
        _cCondExpr = _cCondExpr.replace(/\>{1}\s{2}\={1}/g, ">=");

        // split the filtercond into an array of tokens
        let _aTokens = [];
        _aTokens = _cCondExpr.split(" ");
        // do not remove null elements , bcuz then a string constant such as "A001  " will get converted to "A001"

        let _nArrLen = _aTokens.length;
        let _cToken = "";
        let _cNewCondExpr = "";
        let _cNxtTkn = "";
        
        let _nCtr = 0;
        for (_nCtr = 0; _nCtr <= _nArrLen - 1; _nCtr++) {
            _cToken = _aTokens[_nCtr];

            if (_cToken == "+" || _cToken == "++" || _cToken == "-" || _cToken == "--" || _cToken == "*" || _cToken == "/" || _cToken == "%" || _cToken == "!" || _cToken == "==" || _cToken == "!=" || _cToken == "===" || _cToken == "!==" || _cToken == "<" || _cToken == "<=" || _cToken == ">" || _cToken == ">=" || _cToken == "(" || _cToken == ")" || _cToken == "[" || _cToken == "]" || _cToken == "||" || _cToken == "&&"  || _cToken == "," || _cToken == "?" || _cToken == ":") {
                _cNewCondExpr = _cNewCondExpr + _cToken ; // add the token to the new filter condition 
                continue;
            }

            if (_cToken == "=") {
                mylib.showError("Assignment operator must not be used in an expression");
                return "";
            }

            if (_cToken == "") {
                if (_nCtr + 1 <= _nArrLen - 1) {
                    _cNxtTkn = _aTokens[_nCtr + 1];
                    if (_cNxtTkn == "+" || _cNxtTkn == "++" || _cNxtTkn == "-" || _cNxtTkn == "--" || _cNxtTkn == "*" || _cNxtTkn == "/" || _cNxtTkn == "%" || _cNxtTkn == "!" || _cNxtTkn == "==" || _cNxtTkn == "!=" || _cNxtTkn == "===" || _cNxtTkn == "!==" || _cNxtTkn == "<" || _cNxtTkn == "<=" || _cNxtTkn == ">" || _cNxtTkn == ">=" || _cNxtTkn == "(" || _cNxtTkn == ")" || _cNxtTkn == "[" || _cNxtTkn == "]" || _cNxtTkn == "||" || _cNxtTkn == "&&"  || _cNxtTkn == ","  || _cNxtTkn == "?" || _cNxtTkn == ":") {
                        // there was a space injected to split string, so do not add back space
                    } else {
                        _cNewCondExpr = _cNewCondExpr + " ";  // inject one space, because that is what was used for split                
                    }
                }

                continue;
            }

            if (mylib.IsAllDigit(_cToken)) {
                _cNewCondExpr = _cNewCondExpr + _cToken ; // add the numeric token to the new filter condition 
                
                if (_nCtr + 1 <= _nArrLen - 1) {
                    _cNxtTkn = _aTokens[_nCtr + 1];
                    if (_cNxtTkn == "+" || _cNxtTkn == "++" || _cNxtTkn == "-" || _cNxtTkn == "--" || _cNxtTkn == "*" || _cNxtTkn == "/" || _cNxtTkn == "%" || _cNxtTkn == "!" || _cNxtTkn == "==" || _cNxtTkn == "!=" || _cNxtTkn == "===" || _cNxtTkn == "!==" || _cNxtTkn == "<" || _cNxtTkn == "<=" || _cNxtTkn == ">" || _cNxtTkn == ">=" || _cNxtTkn == "(" || _cNxtTkn == ")" || _cNxtTkn == "[" || _cNxtTkn == "]" || _cNxtTkn == "||" || _cNxtTkn == "&&"  || _cNxtTkn == ","  || _cNxtTkn == "?" || _cNxtTkn == ":") {
                        // there was a space injected to split string, so do not add back space
                    } else {
                        _cNewCondExpr = _cNewCondExpr + " ";  // inject one space, because that is what was used for split                
                    }
                }

                continue;
            }

            // other tokens - lets check if this is record's field or record's object property
            let _lJustToken = mylib.deepReflectHas(this._struct, _cToken) ? false : true ;

            if (_lJustToken) {
                _cNewCondExpr = _cNewCondExpr + _cToken; // add the same token back to the new filter condition 
                if (_nCtr + 1 <= _nArrLen - 1) {
                    _cNxtTkn = _aTokens[_nCtr + 1];
                    if (_cNxtTkn == "+" || _cNxtTkn == "++" || _cNxtTkn == "-" || _cNxtTkn == "--" || _cNxtTkn == "*" || _cNxtTkn == "/" || _cNxtTkn == "%" || _cNxtTkn == "!" || _cNxtTkn == "==" || _cNxtTkn == "!=" || _cNxtTkn == "===" || _cNxtTkn == "!==" || _cNxtTkn == "<" || _cNxtTkn == "<=" || _cNxtTkn == ">" || _cNxtTkn == ">=" || _cNxtTkn == "(" || _cNxtTkn == ")" || _cNxtTkn == "[" || _cNxtTkn == "]" || _cNxtTkn == "||" || _cNxtTkn == "&&"  || _cNxtTkn == ","  || _cNxtTkn == "?" || _cNxtTkn == ":") {
                        // there was a space injected to split string, so do not add back space
                    } else {
                        _cNewCondExpr = _cNewCondExpr + " ";  // inject one space, because that is what was used for split                
                    }
                }

                continue;
            } else {
                _cNewCondExpr = _cNewCondExpr +  _cCntxAlias.trim() + "." + _cToken ; // add a prefix to token and then add it to the new filter condition 

                if (_nCtr + 1 <= _nArrLen - 1) {
                    _cNxtTkn = _aTokens[_nCtr + 1];
                    if (_cNxtTkn == "+" || _cNxtTkn == "++" || _cNxtTkn == "-" || _cNxtTkn == "--" || _cNxtTkn == "*" || _cNxtTkn == "/" || _cNxtTkn == "%" || _cNxtTkn == "!" || _cNxtTkn == "==" || _cNxtTkn == "!=" || _cNxtTkn == "===" || _cNxtTkn == "!==" || _cNxtTkn == "<" || _cNxtTkn == "<=" || _cNxtTkn == ">" || _cNxtTkn == ">=" || _cNxtTkn == "(" || _cNxtTkn == ")" || _cNxtTkn == "[" || _cNxtTkn == "]" || _cNxtTkn == "||" || _cNxtTkn == "&&"  || _cNxtTkn == ","  || _cNxtTkn == "?" || _cNxtTkn == ":") {
                        // there was a space injected to split string, so do not add back space
                    } else {
                        _cNewCondExpr = _cNewCondExpr + " ";  // inject one space, because that is what was used for split                
                    }
                }

                continue;
            }

        }

        return _cNewCondExpr;
    };


    /**
     * This method replaces the columns of the current record as per the given replace with list.
     *  
     * @param {string} _cReplList The list of "replace with clauses", where each clause has a
     * form like : columnname with ${varname}. The "replace with clauses" are usually separated 
     * by commas. The string should be enclosed in backticks to be able to evaluate embedded variables. 
     * 
     * @param {string} [_cSepChars=,] The default separator character to distinguish between 
     * different "replace with clauses" is a comma - however using this property one can
     * define another separator character.
     * 
     * @returns {boolean} This method returns true if it is successful. It returns false if
     * there is an error in any parameter or while updating data.  
     * 
     * @example
     * // replace multiple values on current record using "with" clause
     * let m =  {};
     * m.itemcd = "M001";
     * m.itemname = "Metformin" ;
     * m.stock = 200;
     * mytable.appendBlank();
     * mytable.replaceWith(`itemcd with '${m.itemcd}', itemname with '${m.itemname}', stock with ${m.stock}`);
     * 
     */
    LocalTable.prototype.replaceWith = function (_cReplList, _cSepChars) {
        // check parameters
        if (_cReplList == undefined || _cReplList == "") {
            mylib.showError("replaceWith -  replace list parameter not specified ");
            return false;
        }

        if (typeof _cReplList !== "string") {
            mylib.showError("replaceWith -  replace list parameter is not a list string");
            return false;
        }

        if (this._recno > 0 && this._recno <= this._reccount && this.eof() == false) {
            // proceed
        } else {
            mylib.showError("replaceWith - no current record to replace ");
            return false;
        }

        if (_cSepChars == undefined || _cSepChars == "") {
            _cSepChars = ",";
        }

        // commit current data in case current record's field is used in value list
        // we need not update indexes, as our primary aim of commiting data is to use thisrecord
        this.commit(true);

        // Now parse Replace List in arrays
        let _aReplList = [];
        _aReplList = _cReplList.split(_cSepChars);

        // create temporary thisrecord object, in case we refer to its fields  
        let thisrecord = this._table[this._recno - 1];

        // Now update each element one by one
        let _nArrLen = _aReplList.length;
        let _aReplPair = "";
        let _cPropId = "";
        let _cValExpr = "";
        let _cNewExpr = "";

        let _nCtr = 0;
        for (_nCtr = 0; _nCtr <= _nArrLen - 1; _nCtr++) {
            _aReplPair = _aReplList[_nCtr].split(" with ");
            _cPropId = _aReplPair[0].trim();
            _cValExpr = _aReplPair[1].trim();
            _cNewExpr = this.reformCondition(_cValExpr);
            
            try {
                if (! mylib.deepReflectHas(this._struct, _cPropId)) {
                    mylib.showError("replaceWith - Error - Invalid field/property : " + _cPropId); 
                    return false;
                }

                let _uLhs = mylib.deepReflectGet(this._struct, _cPropId);
                // let _uRhs = (typeof _uLhs == "object" && typeof _cNewExpr == "string" && _cNewExpr.substr(0,1) == "{")  ? mylib.evalExpr(_cNewExpr) : eval(_cNewExpr);
                let _fRhsEvalFx = Function('thisrecord','return ' + _cNewExpr);
                let _uRhs =  _fRhsEvalFx(thisrecord);

                if (typeof _uLhs == "object" && typeof _uRhs == "string" && _uRhs.substr(0,1) == "{") {
                    // special case to handle doubly quoted JSON :
                    // for example : 
                    // mylib.str2MySqlStr(JSON.stringify(_oExtInfo)) creates a string which is doubly quoted like :
                    // ""{\"address\":{\"line1\":\"Progen ERP Systems\",\"line2\":\"Maria Mansion\",\"city\":\"Ponda\",\"state\":\"Goa\",\"pincode\":\"403401\",\"regno\":\"PERP1024537\"}}""
                    // outer eval leads to singly quoted JSON 
                    // "{"address":{"line1":"Progen ERP Systems","line2":"Maria Mansion","city":"Ponda","state":"Goa","pincode":"403401","regno":"PERP1024537"}}"

                    // convert json to object
                    // _uRhs = mylib.evalExpr(_uRhs) ;
                    _fRhsEvalFx = Function('return ' + _uRhs);
                    _uRhs =  _fRhsEvalFx();
                }

                // check datatype compatibility of LHS and RHS 
                if (typeof _uLhs !== typeof _uRhs) {
                    mylib.showError("replaceWith - Error - Data type mismatch for field/property: " + _cPropId); 
                    return false;
                } 
    
                // update data
                if (! mylib.deepReflectSet(this, _cPropId, _uRhs)) {
                    return false;
                }
                
            } catch (error) {
                mylib.showError("replaceWith - Error while updating target field or property " + _cPropId + ", " + error); 
                return false;
            }

        }

        // we don't commit again here, bcuz we are still on that record
        return true;
    };

    
    /**
     * A method to replace values on the current record using a field name and value 
     * object.
     *
     * @param {object} _oReplObject A JSON object specifying the property to be updated with
     * respective values.
     * 
     * @returns {boolean} This method returns true if it is successful. It returns false if
     * there is an error in any parameter or while updating data.  
     * 
     * @example
     * // method to replace values on current record using a field name and value object
     * let m = {};
     * m.itemcd = "V001";
     * m.itemname = "Vicks vaporub" ;
     * m.stock = 300;
     * mytable.appendBlank();
     * mytable.replaceInto({itemcd: m.itemcd, itemname: m.itemname, qty:m.stock}) ; 
     *
     */
    LocalTable.prototype.replaceInto = function (_oReplObject) {
        
        // check if all properties specified in _oReplObject are valid properties or objects in this._struct 
        let _cPropId = null;
        for (_cPropId in _oReplObject) {
            if (typeof this._struct[_cPropId] == "undefined") {
                mylib.showError("replaceInto - the property : " + _cPropId + " is not present in this table "); 
                return false;
            }

            // data type check
            if (typeof this._struct[_cPropId] !== typeof _oReplObject[_cPropId]) {
                mylib.showError("replaceInto - Data Type Mismatch for the property : " + _cPropId  ); 
                return false;
            }
        }

        // update the data
        try {
            mylib.deepObjUpdProperties(this, _oReplObject);
        } catch (error) {
            mylib.showError("replaceInto - Error while updating a property "); 
            return false; 
        }

        return true;

    };    


    /**
     * A method to add a record and replace values on the newly created record using 
     * a field name and value object.
     *
     * @param {object} _oReplObject A JSON object specifying the property to be updated with
     * respective values.
     *  
     * @returns {boolean} This method returns true if it is successful. It returns false if
     * there is an error in any parameter or while updating data.  
     * 
     * @example
     * // Insert a new record and update values
     * let m = {};
     * m.itemcd = "C001";
     * m.itemname = "Colgate Toothpaste";
     * m.stock = 400;
     * mytable.insertInto({itemcd: m.itemcd,itemname: m.itemname, stock: m.stock});
     */
    LocalTable.prototype.insertInto = function (_oReplObject) {
        
        // check if all properties specified in _oReplObject are valid properties or objects in this._struct 
        let _cPropId = null;
        for (_cPropId in _oReplObject) {
            if (typeof this._struct[_cPropId] == "undefined") {
            mylib.showError("insertInto - the property : " + _cPropId + " is not present in this table "); 
            return false;
            }

            // data type check
            if (typeof this._struct[_cPropId] !== typeof _oReplObject[_cPropId]) {
                mylib.showError("insertInto - Data Type Mismatch for the property : " + _cPropId); 
                return false;
            }
    
        }

        // append a blank record
        this.appendBlank();

        // update the data
        try {
            mylib.deepObjUpdProperties(this, _oReplObject);
        } catch (error) {
            mylib.showError("insertInto - Error while updating a property "); 
            return false; 
        }

        return true;

    };    


    /**
     * A method which returns the current record number property of the local table. 
     * 
     * @returns {number} The current record number property of the local table.
     * 
     * @example
     * // find current record number
     * let _nCurRecPtr = mytable.recno();
     */
    LocalTable.prototype.recno = function () { return this._recno; };


    /**
     * A method which returns the record count property of the local table. 
     * 
     * @returns {number} The record count property of the local table.
     * 
     * @example
     * // find total record count
     * let _nTotRecCount = mytable.reccount();
     */
    LocalTable.prototype.reccount = function () { return this._reccount; };


    /**
     * A method to mark the current record as a deleted record.
     *  
     * @returns {boolean}  This method usually returns true. However, if there is no current
     * record (eg. eof), then it will return false.
     * 
     * @example
     * // mark a current record as deleted
     * mytable.delete(); // deletes the current record 
     *
     */
    LocalTable.prototype.delete = function () {
        if (this._recno > 0 && this._recno <= this._reccount && this.eof() == false) {
            this._deleted = true;
            // commit current record into this._table
            this.commit(true);
            return true;
        }

        // no current record, nothing to delete 
        return false;
    };

    /**
     * A method which returns true if the current record is a deleted record.
     *  
     * @returns {boolean} Returns true if the current record is a deleted record, else returns false.
     * 
     * @example
     * // check if a current record is deleted
     * let _lIsDeleted = mytable.deleted(); 
     */
    LocalTable.prototype.deleted = function () { return this._deleted; };


    /**
     * A method to recall the current record if it is marked as a deleted record.
     *  
     * @returns {boolean}  This method usually returns true. However, if there is no current
     * record (eg. eof), then it will return false.
     * 
     * @example
     * // recalls the current record if deleted
     * mytable.recall();  // recalls the current record 
     * 
     */
    LocalTable.prototype.recall = function () {
        if (this._recno > 0 && this._recno <= this._reccount && this.eof() == false) {
            this._deleted = false;
            // commit current record into this._table
            this.commit(true);
            return true;
        }

        //no current record, nothing to recall
        return false;
    };


    /**
     * A method to move the current record pointer to the specified record number.
     * 
     * This method will attempt to move the current record pointer to specified record number
     * irrespective of the current index order or current filter or current status of
     * setdeleted property. 
     *  
     * @param {number}  _nRecordNo The record number to which current record pointer should
     * be set.
     * 
     * @param {boolean} [_lNoCommit=false] As a local table field for a current record can simply be
     * updated by an assignment statement, the LocalTable system does not know about such 
     * updates. Therefore, the LocalTable system always tries to commit the current record to
     * the actual table before moving the record pointer. The commit operation also updates all
     * indexes.
     * 
     * Thus, this flag provides a mechanism to omit unwanted commits and optimise the 
     * operation. The default for this flag is false, which implies that the current record
     * should be committed before carrying out this operation. However, one can set this flag 
     * to true to specify that current record need not be committed before moving the current
     * record pointer as no update is done on the current record. 
     * 
     * @returns {boolean} This method returns true if the specified record exists. It returns
     * false it the specified record is out of range.
     * 
     * @example
     * // go to the first Record
     * let _lResult = mytable.goTo(1); 
     */
    LocalTable.prototype.goTo = function (_nRecordNo, _lNoCommit) {
        if (_nRecordNo == undefined) { return false; }

        // commit previously current record into this._table
        if (_lNoCommit == undefined) {
            _lNoCommit = false;
        }
        
        if (_lNoCommit == false) {
            this.commit();
        }

        // goTO does not care about setDeletedOn or setDeletedOff or filter condition
        if (_nRecordNo < 1 || _nRecordNo > this._reccount) {
            // do nothing, stay whereever the pointer is
            // Note : bof and eof properties also remain in same state
            mylib.showError("record out of range");
            return false;
        }

        this._recno = _nRecordNo;
        this._bof = false;
        this._eof = false;

        // inject specified record's data into upper layer 
        let _cPropId = null;
        for (_cPropId in this._struct) {
            if (typeof this[_cPropId] == "object") {
                // first do simple full deep object clone from _struct to have a blank object
                // copy object in safe manner 
                this[_cPropId] = JSON.parse(JSON.stringify(this._struct[_cPropId]));
                // attach prototypes on this object, so that all methods are readily available on the object
                mylib.deepObjUpdPrototypes(this[_cPropId], this._struct[_cPropId]);

                // then do a mylib.deepObjUpdProperties from the given record
                // (this helps us refresh the object structure whenever it changes, and fix the object data in the table)   
                // we can't really just assign the table's old row's object to upper layer as object's specs 
                // could have been changed using modistru. so we do this.
                mylib.deepObjUpdProperties(this[_cPropId], this._table[this._recno - 1][_cPropId]);

            } else {
                this[_cPropId] = this._table[this._recno - 1][_cPropId];
                if (this[_cPropId] == undefined) {
                    this[_cPropId] = this._struct[_cPropId];
                }
            }
        } // end for

        return true;
    };


    /**
     * A method which changes the current record pointer to the top of the local table.
     * 
     * This method will attempt to go to the first available record of the local table.
     * If the table has a current index order, this method will traverse the table in the 
     * index sequence. If there is a current filter on the table, this method will ignore the
     * records which do not meet the filter condition. Moreover, if current status of 
     * setdeleted property is true, then this method will ignore the records which are deleted. 
     *
     * @param {boolean} [_lNoCommit=false] As a local table field for a current record can simply be
     * updated by an assignment statement, the LocalTable system does not know about such 
     * updates. Therefore, the LocalTable system always tries to commit the current record to
     * the actual table before moving the record pointer. The commit operation also updates all
     * indexes.
     * 
     * Thus, this flag provides a mechanism to omit unwanted commits and optimise the 
     * operation. The default for this flag is false, which implies that the current record
     * should be committed before carrying out this operation. However, one can set this flag 
     * to true to specify that the current record need not be committed before moving the current
     * record pointer as no update is done on the current record. 
     * 
     * @returns {boolean} This method returns true if a record is located after its execution, 
     * otherwise it returns false.
     * 
     * @example
     * // go to topmost record
     * mytable.goTop();  // the current record pointer position should be 1 now 
     * 
     */
    LocalTable.prototype.goTop = function (_lNoCommit) {
        if (_lNoCommit == undefined) {
            _lNoCommit = false;
        }

        if (_lNoCommit == false) {
            this.commit();
        }

        if (this._reccount == 0) {
            this._bof = true; // match FPW logic
            return false;
        }

        if (this._curorder > 0) {
            // if there is a current index , then do goTop using the index sequence
            return this.goIndexedTop(true);
        }

        // goTop is certainly affected by setDeletedOn or setDeletedOff or setFilter

        // if this._setdeleted is false and there is no filter condition, then go to first record  
        if (this._setdeleted == false && this._filtercond.length == 0) {
            return this.goTo(1, true);
        }

        // either setdeleted is true or filter condition is present
        // find first record which satisfies the given criterion
        let _nFirstRec = 0;
        let thisrecord = {}; // object to temporarily hold current record 
        let _nRecCtr = 0;
        for (_nRecCtr = 1; _nRecCtr <= this._reccount; _nRecCtr++) {
            if (this._setdeleted == true && this._table[_nRecCtr - 1]._deleted == true) {
                // setdeleted is true and this record is a deleted record , so skip it
                continue;
            }

            if (this._filtercond.length > 0) {
                // evaluate filter condition, if fails skip it
                // filter like "qty > 0" is already transformed to "thisrecord.qty > 0" in this._filtercond

                // create temporary thisrecord object 
                thisrecord = this._table[_nRecCtr - 1];

                // if (eval(this._filtercond) == false) {
                //    continue;
                // }
                if (this._filterevalfx(thisrecord) == false) {
                    continue;
                }

            }

            _nFirstRec = _nRecCtr;
            break;
        }

        if (_nFirstRec > 0) {
            return this.goTo(_nFirstRec, true);
        }

        // No First record Available, Force BOFEOF 
        this.forceBofEof();
        this._bof = false;  // to match logic with FPW
        return false;
    }

    // private function
    LocalTable.prototype.forceBofEof = function () {
        this._recno = this._reccount + 1;
        this._bof = true;
        this._eof = true;


        // inject empty structure's fields into upper layer 
        let _cPropId = null;
        for (_cPropId in this._struct) {
            if (typeof this._struct[_cPropId] == "object") {
                // copy object in safe manner 
                this[_cPropId] = JSON.parse(JSON.stringify(this._struct[_cPropId]));
                // attach prototypes on this object, so that all methods are readily available on the object
                mylib.deepObjUpdPrototypes(this[_cPropId], this._struct[_cPropId]);
            } else {
                this[_cPropId] = this._struct[_cPropId];
            }
        } // end for

        return true;
    };



    /**
     * 
     * A method which changes the current record pointer to the bottom of the local table.
     * 
     * This method will attempt to go to the last available record of the local table.
     * If the table has a current index order, this method will traverse the table in the 
     * index sequence. If there is a current filter on the table, this method will ignore the
     * records which do not meet the filter condition. Moreover, if current status of 
     * setdeleted property is true, then this method will ignore the records which are
     * deleted. 
     * 
     * @param {boolean} [_lNoCommit=false] As a local table field for a current record can simply be
     * updated by an assignment statement, the LocalTable system does not know about such 
     * updates. Therefore, the LocalTable system always tries to commit the current record to
     * the actual table before moving the record pointer. The commit operation also updates all
     * indexes.
     * 
     * Thus, this flag provides a mechanism to omit unwanted commits and optimise the 
     * operation. The default for this flag is false, which implies that the current record
     * should be committed before carrying out this operation. However, one can set this flag 
     * to true to specify that current record need not be committed before moving the current
     * record pointer as no update is done on the current record. 
     * 
     * @returns {boolean} This method returns true if a record is located after its execution, 
     * otherwise it returns false.
     * 
     * @example
     * // go to last record
     * mytable.goBottom();  // the current record pointer position will be 3 now, as 4th record is deleted
     *  
     */
    LocalTable.prototype.goBottom = function (_lNoCommit) {

        if (_lNoCommit == undefined) {
            _lNoCommit = false;
        }

        if (_lNoCommit == false) {
            this.commit();
        }


        if (this._reccount == 0) {
            this._bof = true; // match FPW logic
            return false;
        }

        if (this._curorder > 0) {
            // if there is a current index , then do gobottom using the index sequence
            return this.goIndexedBottom(true);
        }

        // goBottom is certainly affected by setDeletedOn or setDeletedOff or setFilter

        // if this._setdeleted is false and there is no filter condition, then go to last record 
        if (this._setdeleted == false && this._filtercond.length == 0) {
            return this.goTo(this._reccount, true);
        }

        // either setdeleted is true or filter condition is present
        // find first record from bottom which satisfies the given criterion
        let _nFirstRec = 0;
        let thisrecord = {}; // object to temporarily hold current record 
        let _nRecCtr = 0;
        for (_nRecCtr = this._reccount; _nRecCtr > 0; _nRecCtr--) {
            if (this._setdeleted == true && this._table[_nRecCtr - 1]._deleted == true) {
                // setdeleted is true and this record is a deleted record , so skip it
                continue;
            }

            if (this._filtercond.length > 0) {
                // evaluate filter condition, if fails skip it
                // filter like "qty > 0" is already transformed to "thisrecord.qty > 0" in this._filtercond

                // create temporary thisrecord object 
                thisrecord = this._table[_nRecCtr - 1];

                // if (eval(this._filtercond) == false) {
                //    continue;
                // }
                if (this._filterevalfx(thisrecord) == false) {
                    continue;
                }

            }

            _nFirstRec = _nRecCtr;
            break;
        }

        if (_nFirstRec > 0) {
            return this.goTo(_nFirstRec, true);
        }

        // No such First record Available, Force BOFEOF 
        this.forceBofEof();
        return false;
    };


    /**
     * A method which changes the current record pointer by specified number of records
     * relative to the current record of the local table.
     * 
     * If the table has a current index order, this method will traverse the table in the 
     * index sequence. If there is a current filter on the table, this method will ignore the
     * records which do not meet the filter condition. Moreover, if current status of 
     * setdeleted property is true, then this method will ignore the records which are
     * deleted.
     * 
     * @param {number} [_nRecs=1] The number of records by which the current pointer is to be 
     * moved. This value can be positive (implying forward skip) or negative (implying 
     * backward skip). The default is 1.
     * 
     * @param {boolean} [_lNoCommit=false] As a local table field for a current record can simply be
     * updated by an assignment statement, the LocalTable system does not know about such 
     * updates. Therefore, the LocalTable system always tries to commit the current record to
     * the actual table before moving the record pointer. The commit operation also updates all
     * indexes.
     * 
     * Thus, this flag provides a mechanism to omit unwanted commits and optimise the 
     * operation. The default for this flag is false, which implies that the current record
     * should be committed before carrying out this operation. However, one can set this flag 
     * to true to specify that current record need not be committed before moving the current
     * record pointer as no update is done on the current record. 
     * 
     * @returns {boolean} This method returns true if a record is located after its execution, 
     * otherwise it returns false.
     * 
     * @example
     * // skip backward relative to current pointer
     * mytable.skip(-1);  // goes to 2nd record 
     *
     * // skip forward relative to current pointer
     * mytable.skip(1);  // goes to 3rd record
     *
     */
    LocalTable.prototype.skip = function (_nRecs, _lNoCommit) {
        if (_lNoCommit == undefined) {
            _lNoCommit = false;
        }

        if (_lNoCommit == false) {
            // commit previously current record into this._table    
            this.commit();
        }

        if (_nRecs == undefined) {
            _nRecs = 1;
        }

        if (_nRecs == 0) { return false; }

        if (this._reccount == 0) {
            this._bof = true; // match FPW logic
            return false;
        }

        if (this._curorder > 0) {
            // if there is a current index , then do gobottom using the index sequence
            return this.indexedSkip(_nRecs, true);
        }

        // _nRecs can be +ve or -ve integer , ie. skip(1) , skip(-2)

        // skip is certainly affected by setDeletedOn or setDeletedOff or setFilter

        // if this._setdeleted is false and there is no filter condition, then go to first record  
        // if (this._setdeleted == false && this._filtercond.length==0) {
        //     return this.goTo(this._recno + _nRecs, true);
        // }

        // either setdeleted is true or filter condition is present
        // find first record which satisfies the criteria by skipping at least _nRecs records
        let _nFirstRec = 0;
        let thisrecord = {}; // object to temporarily hold current record 

        if (_nRecs > 0) {
            // scan in forward direction
            let _nRecCtr = 0;
            for (_nRecCtr = this._recno + _nRecs; _nRecCtr <= this._reccount; _nRecCtr++) {

                if (this._setdeleted == true && this._table[_nRecCtr - 1]._deleted == true) {
                    // setdeleted is true and this record is a deleted record , so skip it
                    continue;
                }

                if (this._filtercond.length > 0) {
                    // evaluate filter condition, if fails skip it
                    // filter like "qty > 0" is already transformed to "thisrecord.qty > 0" in this._filtercond

                    // create temporary thisrecord object 
                    thisrecord = this._table[_nRecCtr - 1];

                    // if (eval(this._filtercond) == false) {
                    //     continue;
                    // }
                    if (this._filterevalfx(thisrecord) == false) {
                        continue;
                    }

                }

                _nFirstRec = _nRecCtr;
                break;
            }

            if (_nFirstRec > 0) {
                return this.goTo(_nFirstRec, true);
            }

            // No First record Available, Force BOFEOF 
            this.forceBofEof();
            this._bof = false;  // to match logic with FPW
            return false;
        }


        if (_nRecs < 0) {
            // scan in backward direction
            _nFirstRec = 0;
            let _nRecCtr = 0;
            for (_nRecCtr = this._recno + _nRecs; _nRecCtr > 0; _nRecCtr--) {
                if (this._setdeleted == true && this._table[_nRecCtr - 1]._deleted == true) {
                    // setdeleted is true and this record is a deleted record , so skip it
                    continue;
                }

                if (this._filtercond.length > 0) {
                    // evaluate filter condition, if fails skip it
                    // filter like "qty > 0" is already transformed to "thisrecord.qty > 0" in this._filtercond

                    // create temporary thisrecord object 
                    thisrecord = this._table[_nRecCtr - 1];

                    // if (eval(this._filtercond) == false) {
                    //     continue;
                    // }
                    if (this._filterevalfx(thisrecord) == false) {
                        continue;
                    }
        
                }

                _nFirstRec = _nRecCtr;
                break;
            }

            if (_nFirstRec > 0) {
                return this.goTo(_nFirstRec, true);
            }

            // special logic : can not do skip -n to a record which meets the condition. 
            // So, try to go to top record which meets the condition.
            // go to top record, but _lNoCommit = true
            if (this.goTop(true) == true) {
                this._bof = true;
                return false;
            }

            // No First record , nor top record Available, Force BOFEOF 
            this.forceBofEof();
            return false;
        }
    };


    /**
     * A method to locate the first record which satisfies a given condition. 
     * 
     * This method will attempt to locate the first record which satisfies the given condition
     * and change the current record pointer to the located record. If no record is found which
     * matches the given condition, then current record pointer is set to eof. 
     *
     * If the table has a current index order, this method will traverse the table in the 
     * index sequence. If there is a current filter on the table, this method will ignore the
     * records which do not meet the filter condition. Moreover, if current status of
     * setdeleted property is true, then this method will ignore the records which are 
     * deleted. 
     * 
     * @param {string} _cCondExpr The condition which must evaluate to true for the selected
     * record.
     * 
     * @param {boolean} [_lNoCommit=false] As a local table field for a current record can simply be
     * updated by an assignment statement, the LocalTable system does not know about such 
     * updates. Therefore, the LocalTable system always tries to commit the current record to
     * the actual table before moving the record pointer. The commit operation also updates all
     * indexes.
     * 
     * Thus, this flag provides a mechanism to omit unwanted commits and optimise the 
     * operation. The default for this flag is false, which implies that the current record
     * should be committed before carrying out this operation. However, one can set this flag 
     * to true to specify that current record need not be committed before moving the current
     * record pointer as no update is done on the current record. 
     * 
     * @returns {boolean} The method returns true if a record is located, otherwise it returns
     * false.
     * 
     * @example
     * // try to locate a non-existent record
     * let _lResult = mytable.locate("itemcd == 'X001' ") ; // _lResult should be false 
     * 
     * // try to locate an existing record
     * let _lResult = mytable.locate("itemcd == 'V001' ") ; // _lResult should be true 
     *
     */
    LocalTable.prototype.locate = function (_cCondExpr, _lNoCommit) {
        if (_lNoCommit == undefined) {
            _lNoCommit = false;
        }

        if (_lNoCommit == false) {
            // commit previously current record into this._table   
            this.commit();
        }

        if (_cCondExpr == undefined || _cCondExpr == "") {
            mylib.showError("Error : no locate condition specified in locate call");
            return false;
        }

        if (this._reccount == 0) {
            this._bof = true; // match FPW logic
            return false;
        }

        if (this._curorder > 0) {
            // if there is a current index , then do locate using the index sequence
            return this.indexedLocate(_cCondExpr, true);
        }

        let _cNewCondExpr = this.reformCondition(_cCondExpr);
        if (_cNewCondExpr == "") { return false; }
        let _fNewCondEvalFx =  Function('thisrecord', 'return ' + _cNewCondExpr);


        // locate is certainly affected by setDeletedOn or setDeletedOff or setFilter
        // Let's first go to top record
        this.goTop(true); // go to top record, but _lNoCommit = true
        if (this.eof() == false) {
            // find first record which satisfies the criteria 
            let _nFirstRec = 0;
            let thisrecord = {}; // object to temporarily hold current record 

            // scan in forward direction
            let _nRecCtr = 0; 
            for (_nRecCtr = this._recno; _nRecCtr <= this._reccount; _nRecCtr++) {

                if (this._setdeleted == true && this._table[_nRecCtr - 1]._deleted == true) {
                    // setdeleted is true and this record is a deleted record , so skip it
                    continue;
                }

                // create temporary thisrecord object 
                thisrecord = this._table[_nRecCtr - 1];

                if (this._filtercond.length > 0) {
                    // evaluate filter condition, if fails skip it
                    // filter like "qty > 0" is already transformed to "thisrecord.qty > 0" in this._filtercond
                    // if (eval(this._filtercond) == false) {
                    //     continue;
                    // }
                    if (this._filterevalfx(thisrecord) == false) {
                        continue;
                    }
                }

                try {
                    // if (eval(_cNewCondExpr) == true) {
                    //     _nFirstRec = _nRecCtr;
                    //     break;
                    // }

                    if ( _fNewCondEvalFx(thisrecord) == true) {
                        _nFirstRec = _nRecCtr;
                        break;
                    }
        
                } catch (error) {
                    mylib.showError("locate - Error while evaluating Locate Condition Expression, " + error); 
                    return false;
                }
        
            }

            if (_nFirstRec > 0) {
                return this.goTo(_nFirstRec, true);
            }

            // No First record available, Force BOFEOF 
            this.forceBofEof();
            this._bof = false;  // to match logic with FPW
            return false;

        } else {
            // eof on go top - nothing to locate
            return false;
        }

    };


    /**
     * A method which returns the bof property of the local table.
     *  
     * @returns {boolean} Returns true if the current record pointer is at the beginning of the 
     * File/Table, else returns false. 
     * 
     * @example
     * // find if the current record pointer is at the beginning of the file 
     * let _lIsBof = mytable.bof();
     * 
     */
    LocalTable.prototype.bof = function () { return this._bof; };

    /**
     * A method which returns the eof property of the local table. 
     * 
     * @returns {boolean} Returns true if the current record pointer is at the end of the 
     * File/Table, else returns false.
     * 
     * @example
     * // find if the current record pointer is at the end of the file
     * let _lIsEof = mytable.eof();
     */
    LocalTable.prototype.eof = function () { return this._eof; };

    /**
     * A method which returns true if a record was found after a navigation operation such as
     * seek, skip, locate etc.
     * 
     * @returns {boolean} Returns true if we have a current record as a result of a navigation operation,
     * else returns false.   
     * 
     * @example
     * // determine if a record was found by last navigation operation
     * let _lFound = mytable.found();
     */
    LocalTable.prototype.found = function () { return !this._eof; };


    /**
     * A method which returns the setdeleted property of the table.
     * 
     * The setdeleted property is true by default for a local table. When this property is
     * set to true, all navigation operations such as goTop, goBottom, skip, locate and seek
     * (except goTo) will bypass the deleted records, as if they don't exist in the table.  
     * 
     * However, if the setdeleted property is set to false, all the above navigation 
     * operations will not ignore the deleted records. 
     * 
     * @returns {boolean} The setdeleted property of the local table - is the setdeleted
     * property true or false ?
     * 
     * @example
     * // query the setdeleted attribute of the table
     * let _lSetDeleted = mytable.setdeleted(); 
     */
    LocalTable.prototype.setdeleted = function () { return this._setdeleted; };


    /**
     * A method which sets the setdeleted property of the local table as false.
     * 
     * @returns {boolean} true.
     * 
     * @example
     * // we are telling the system to not bypass deleted records during navigation
     *  mytable.setDeletedOff(); 
     */
    LocalTable.prototype.setDeletedOff = function () {
        this._setdeleted = false;
        return true;
    };

    /**
     * A method which sets the setdeleted property of the local table as true.
     * 
     * @returns {boolean} true.
     * 
     * @example
     * // reset the setdeleted attribute to true
     * mytable.setDeletedOn();
     *  
     */
    LocalTable.prototype.setDeletedOn = function () {
        this._setdeleted = true;
        return true;
    };


    /**
     * A method which returns the current filter condition on the table, if any.
     * 
     * When a filter is set on a local table, all navigation operations such as goTop, 
     * goBottom, skip, locate and seek (except goTo) will bypass the records which do not
     * satisfy the filter condition, as if they don't exist in the table.  
     * 
     * @returns {string} A string which specifies the filter expression on current table.
     * 
     * @example
     * // Find the current filter condition 
     * let _cFilterCondExpr = mytable.filter() 
     */
    LocalTable.prototype.filter = function () { return this._filtercond; };


    /**
     * A method to set a filter condtion on the local table.
     * 
     * @param {string} _cCondExpr The filter condition.
     * 
     * @returns {boolean} This method returns true if it is a success. If there is an error
     * in filter condition, then it returns false.
     * 
     * @example
     * // set filter condition on the table
     * mytable.setFilter("stock > 0");  // sets filter to records where stock > 0
     *
     */
    LocalTable.prototype.setFilter = function (_cCondExpr) {
        if (_cCondExpr == undefined) { return false; }

        // if _cCondExpr is "", re-set filter
        if (_cCondExpr == "") {
            this._filtercond = "";
            this._filterevalfx = null;
            return true;
        }

        let _cFilterCond = this.reformCondition(_cCondExpr);
        let _fFilterEvalFx = Function("thisrecord", 'return ' + _cFilterCond);

        // evaluate filter condition to check if a syntactically correct filter is specified 
        try {
            // create temporary thisrecord object 
            let thisrecord = this.getEmptyRecord();  // this._table[0];
            // let _lEvalFilter = eval(_cFilterCond) ;
            let _lEvalFilter =  _fFilterEvalFx(thisrecord);

            if (typeof _lEvalFilter == "boolean") {
                this._filtercond = _cFilterCond;
                this._filterevalfx = _fFilterEvalFx;
                return true;
            } else {
                this._filtercond = "";
                this._filterevalfx = null;
                mylib.showError("setFilter - the specified filter is not a logical expression"); 
                return false;
            }

        } catch (error) {
            this._filtercond = "";
            this._filterevalfx = null;
            mylib.showError("setFilter - Error while evaluating Filter Condition, " + error); 
            return false;
        }
        
    };


    /**
     * A method to clear an existing filter on the local table.
     * 
     * @returns {boolean} true.
     *  
     * @example
     * // clear an existing filter on the table
     * mytable.clearFilter();
     */
    LocalTable.prototype.clearFilter = function () {
        this._filtercond = "";
        this._filterevalfx = null;
        return true;
    };


    /**
     * A method to replace values on all the records which satisfy a given condition using
     * a replace with list.
     * 
     * @param {string} _cReplList The list of "replace with clauses", where each clause has a
     * form like : columnname with varname. The "replace with clauses" are usually separated 
     * by commas.
     * 
     * @param {string} [_cSepChars=,] The default separator character to distinguish between 
     * different "replace with clauses" is a comma. However using this property one can
     * define another separator character.
     * 
     * @param {string} [_cCondExpr=true] The condition which must evaluate to true for each record
     * before the record is updated. If this condition is not specified, then its default is
     * true which always succeeds for all records.          
     * 
     * @returns {boolean} The result of the operation. The result will usually be true. 
     * However, if the operation fails due to reasons such as "no records to replace" or
     * "error in evalaution of condition expression", then the result will be false. 
     * 
     * @example
     * // replace one or multiple values on many records which meet a condition
     * mytable.replaceAll("stock with stock - 10", ",", "stock > 10"); // reduce stock by 10 where stock is > 10
     *  
     */
    LocalTable.prototype.replaceAll = function (_cReplList, _cSepChars, _cCondExpr) {
        if (this._reccount == 0) {
            this._bof = true; // match FPW logic
            return false;
        }

        // commit previously current record into this._table  
        // update indexes also as we are going to move record pointer 
        this.commit();

        let _cNewCondExpr = "";
        if (_cCondExpr == undefined || _cCondExpr == "") {
            _cNewCondExpr = "true";
        } else {
            _cNewCondExpr = this.reformCondition(_cCondExpr);
            if (_cNewCondExpr == "") { return false; }
        }

        let _fNewCondEvalFx =  Function('thisrecord', 'return ' + _cNewCondExpr);

        // check parameters
        if (_cReplList == undefined || _cReplList == "") {
            mylib.showError("replaceAll -  replace list parameter not passed ");
            return false;
        }

        if (typeof _cReplList !== "string") {
            mylib.showError("replaceAll -  replace list parameter is not a list string");
            return false;
        }

        if (_cSepChars == undefined || _cSepChars == "") {
            _cSepChars = ",";
        }

        // Now parse Field List and Value List in arrays
        let _aReplList = [];
        _aReplList = _cReplList.split(_cSepChars);

        
        // Now update each element one by one
        let _nArrLen = _aReplList.length;
        let _aReplPair = "";
        let _cPropId = "";
        let _cValExpr = "";

        let _aReplpairArr = [];
        let _nCtr = 0; 
        for (_nCtr = 0; _nCtr <= _nArrLen - 1; _nCtr++) {
            _aReplPair = _aReplList[_nCtr].split(" with ");
            _aReplpairArr[_nCtr] = { _cPropId: _aReplPair[0].trim(), _cValExpr: this.reformCondition(_aReplPair[1].trim()) };

            _cPropId = _aReplpairArr[_nCtr]._cPropId;
            if (! mylib.deepReflectHas(this._struct, _cPropId)) {
                mylib.showError("replaceAll - Error - Invalid field/property : " + _cPropId); 
                return false;
            }
        }


        // replaceAll is certainly affected by setDeletedOn or setDeletedOff or setFilter
        // Let's first go to 1st physical record (as we are not traversing using index)
        this.goTo(1); 

        if (this.eof() == false) {
            // save current index order
            let _nSvOrder = this._curorder ;

            // set current order to -1, so that commits do not update indexes (we will reindex later) 
            this._curorder = -1;

            let thisrecord = {}; // object to temporarily hold current record 

            // scan in forward direction
            let _nRecCtr = 0;
            for (_nRecCtr = this._recno; _nRecCtr <= this._reccount; _nRecCtr++) {

                if (this._setdeleted == true && this._table[_nRecCtr - 1]._deleted == true) {
                    // setdeleted is true and this record is a deleted record , so skip it
                    continue;
                }

                // create temporary thisrecord object 
                thisrecord = this._table[_nRecCtr - 1];

                if (this._filtercond.length > 0) {
                    // evaluate filter condition, if fails skip it
                    // filter like "qty > 0" is already transformed to "thisrecord.qty > 0" in this._filtercond
                    // if (eval(this._filtercond) == false) {
                    //     continue;
                    // }
                    if (this._filterevalfx(thisrecord) == false) {
                        continue;
                    }
                }

                let _lNewCond = false;

                try {
                    // _lNewCond = eval(_cNewCondExpr) ;
                    _lNewCond = _fNewCondEvalFx(thisrecord) ;
                } catch (error) {
                    mylib.showError("replaceAll - Error while evaluating Condition Expression, " + error); 
                    return false;
                }

                if (_lNewCond == true) {
                    // we go to the actual record to avoid failing of commands such as following :
                    this.goTo(_nRecCtr) ;
                    let _nCtr = 0;
                    for (_nCtr = 0; _nCtr <= _nArrLen - 1; _nCtr++) {
                        _cPropId = _aReplpairArr[_nCtr]._cPropId;
                        _cValExpr = _aReplpairArr[_nCtr]._cValExpr;


                        try {
                            let _uLhs = mylib.deepReflectGet(this._struct, _cPropId);
                            // let _uRhs =  (typeof _uLhs == "object" && typeof _cValExpr == "string" && _cValExpr.substr(0,1) == "{")  ? mylib.evalExpr(_cValExpr) : eval(_cValExpr);
                            let _fRhsEvalFx = Function('thisrecord', 'return ' + _cValExpr);
                            let _uRhs =  _fRhsEvalFx(thisrecord);
                

                            if (typeof _uLhs == "object" && typeof _uRhs == "string" && _uRhs.substr(0,1) == "{") {
                                // special case to handle doubly quoted JSON :
                                // for example : 
                                // mylib.str2MySqlStr(JSON.stringify(_oExtInfo)) creates a string which is doubly quoted like :
                                // ""{\"address\":{\"line1\":\"Progen ERP Systems\",\"line2\":\"Maria Mansion\",\"city\":\"Ponda\",\"state\":\"Goa\",\"pincode\":\"403401\",\"regno\":\"PERP1024537\"}}""
                                // outer eval leads to singly quoted JSON 
                                // "{"address":{"line1":"Progen ERP Systems","line2":"Maria Mansion","city":"Ponda","state":"Goa","pincode":"403401","regno":"PERP1024537"}}"

                                // convert json to object
                                // _uRhs = mylib.evalExpr(_uRhs)
                                _fRhsEvalFx = Function('return ' + _uRhs);
                                _uRhs =  _fRhsEvalFx();
                            }
                
                            // check datatype compatibility of LHS and RHS 
                            if (typeof _uLhs !== typeof _uRhs) {
                                mylib.showError("replaceWith - Error - Data type mismatch for field/property: " + _cPropId); 
                                return false;
                            } 
                
                            // update data
                            if (! mylib.deepReflectSet(this, _cPropId, _uRhs)) {
                                return false;
                            }

                        } catch (error) {
                            mylib.showError("replaceAll - Error while updating target field or property : " + _cPropId + ", "  + error); 
                            return false;
                        }

                    }
                }

            } // end for

            // reindex data
            this.reindex();

            // restore index order
            this._curorder = _nSvOrder;

            // Force BOFEOF 
            this.forceBofEof();
            this._bof = false;  // to match logic with FPW
            return true;

        } else {
            // eof on goto(1) - nothing to replace 
            return false;
        }

    };



    /**
     * A method to delete all the records which meet the specified condition.
     * 
     * @param {string} [_cCondExpr=true] The condition which must evaluate to true for each record
     * before the record is deleted. If this condition is not specified, then its default is
     * true which always succeeds for all records. 
     *     
     * @returns {boolean} The result of the operation. The result will usually be true. 
     * However, if the operation fails due to reasons such as "no records to delete" or
     * "error in evalaution of condition expression", then the result will be false. 
     * 
     * @example
     * // delete all records which satisfy a given condition
     * mytable.deleteAll("stock == 0") ; // deletes all records with nil stock
     * mytable.deleteAll(); // deletes all records
     * 
     */
    LocalTable.prototype.deleteAll = function (_cCondExpr) {
        if (this._reccount == 0) {
            this._bof = true; // match FPW logic
            return false;
        }

        // commit previously current record into this._table  
        // update indexes also as we are going to move record pointer 
        this.commit();

        let _cNewCondExpr = "";
        if (_cCondExpr == undefined || _cCondExpr == "") {
            _cNewCondExpr = "true";
        } else {
            _cNewCondExpr = this.reformCondition(_cCondExpr);
            if (_cNewCondExpr == "") { return false; }
        }

        let _fNewCondEvalFx =  Function('thisrecord', 'return ' + _cNewCondExpr);

        
        // deleteAll is certainly affected by setFilter
        // Let's first go to 1st physical record (as we are not traversing using index)
        this.goTo(1, true); // go to 1st record, but _lNoCommit = true
        if (this.eof() == false) {
            let thisrecord = {}; // object to temporarily hold current record 

            // scan in forward direction
            let _nRecCtr = 0;
            for (_nRecCtr = this._recno; _nRecCtr <= this._reccount; _nRecCtr++) {

                // create temporary thisrecord object 
                thisrecord = this._table[_nRecCtr - 1];

                if (this._filtercond.length > 0) {
                    // evaluate filter condition, if fails skip it
                    // filter like "qty > 0" is already transformed to "thisrecord.qty > 0" in this._filtercond
                    // if (eval(this._filtercond) == false) {
                    //     continue;
                    // }

                    if (this._filterevalfx(thisrecord) == false) {
                        continue;
                    }
                }

                try {
                    // if (eval(_cNewCondExpr) == true) {
                    //     this._table[_nRecCtr - 1]._deleted = true;
                    // }

                    if ( _fNewCondEvalFx(thisrecord) == true) {
                        this._table[_nRecCtr - 1]._deleted = true;
                    }
                } catch (error) {
                    mylib.showError("deleteAll - Error while evaluating delete Condition Expression, " + error); 
                    return false;
                }

            }

            // Force BOFEOF 
            this.forceBofEof();
            this._bof = false;  // to match logic with FPW
            return true;
        } else {
            // eof on goto(1) - nothing to delete 
            return false;
        }
    };



    /**
     * A method to recall all deleted records which meet the specified condition.
     * 
     * @param {string} [_cCondExpr=true] The condition which must evaluate to true for each record
     * before the record is recalled. If this condition is not specified, then its default is
     * true which always succeeds for all records. 
     *     
     * @returns {boolean} The result of the operation. The result will usually be true. 
     * However, if the operation fails due to reasons such as "no records to recall" or
     * "error in evalaution of condition expression", then the result will be false. 
     * 
     * @example
     * // recall all records which satisfy a given condition
     * mytable.recallAll("stock == 0") ; // recalls all records with nil stock
     * mytable.recallAll() ; // recalls all deleted records
     * 
     */
    LocalTable.prototype.recallAll = function (_cCondExpr) {
        if (this._reccount == 0) {
            this._bof = true; // match FPW logic
            return false;
        }

        // commit previously current record into this._table   
        // update indexes also as we are going to move record pointer 
        this.commit();

        let _cNewCondExpr = "";
        if (_cCondExpr == undefined || _cCondExpr == "") {
            _cNewCondExpr = "true";
        } else {
            _cNewCondExpr = this.reformCondition(_cCondExpr);
            if (_cNewCondExpr == "") { return false; }
        }

        let _fNewCondEvalFx =  Function('thisrecord', 'return ' + _cNewCondExpr);


        // recallAll is certainly affected by r
        // Let's first go to 1st physical record (as we are not traversing using index)
        this.goTo(1, true); // go to 1st record, but _lNoCommit = true
        if (this.eof() == false) {
            let thisrecord = {}; // object to temporarily hold current record 

            // scan in forward direction
            let _nRecCtr = 0;
            for (_nRecCtr = this._recno; _nRecCtr <= this._reccount; _nRecCtr++) {

                // create temporary thisrecord object 
                thisrecord = this._table[_nRecCtr - 1];

                if (this._filtercond.length > 0) {
                    // evaluate filter condition, if fails skip it
                    // filter like "qty > 0" is already transformed to "thisrecord.qty > 0" in this._filtercond
                    // if (eval(this._filtercond) == false) {
                    //     continue;
                    // }
                    if (this._filterevalfx(thisrecord) == false) {
                        continue;
                    }
                }

                
                try {
                    // if (eval(_cNewCondExpr) == true) {
                    //     this._table[_nRecCtr - 1]._deleted = false;
                    // }

                    if ( _fNewCondEvalFx(thisrecord) == true) {
                        this._table[_nRecCtr - 1]._deleted = false;
                    }
                } catch (error) {
                    mylib.showError("recallAll - Error while evaluating recall Condition Expression, " + error); 
                    return false;
                }

            }

            // Force BOFEOF 
            this.forceBofEof();
            this._bof = false;  // to match logic with FPW
            return true;

        } else {
            // eof on goto(1) - nothing to delete 
            return false;
        }
    };

    /**
     * A method to permanently remove records which are marked as deleted.
     * 
     * @returns {boolean} true.
     * 
     * @example
     * // permanently remove the deleted records - ie. pack the table
     * mytable.pack();
     */
    LocalTable.prototype.pack = function () {
        if (this._reccount == 0) {
            this._bof = true; // match FPW logic
            return true;
        }

        // first commit current data 
        // skip update of index as we reindex later any way
        this.commit(true);

        // Now copy out all records which are not deleted into another object
        let newtable = [];        // new table data - array of record objects 
        let thisrecord = {};      // object to temporarily hold current record
        let _nNewCnt = 0;

        let _nRecCtr = 0;
        for (_nRecCtr = 1; _nRecCtr <= this._reccount; _nRecCtr++) {
            if (this._table[_nRecCtr - 1]._deleted == true) {
                // this record is a deleted record , so skip it
                this._table[_nRecCtr - 1] = null;
                continue;
            }

            // create temporary thisrecord object 
            thisrecord = this._table[_nRecCtr - 1];

            // append the record into new table
            _nNewCnt++;
            newtable[_nNewCnt - 1] = thisrecord;
        }

        // reassign table
        this._table = newtable;
        this._reccount = _nNewCnt;

        // Before reindexing, go to 1st physical record of Table, but do not do commit again.
        // This is important workaround, else reindex will commit whatever is there in so called current record 
        // and the change made in physical record won't be reflected.   
        this.goTo(1, true);

        // reindex
        this.reindex();

        // Again, go to Top of Table using current index, but do not do commit again.
        this.goTop(true);
        return true;
    };

    /**
     * A method to permanently delete all records in a local table, irrespective of whether they
     * are marked as deleted or not.
     * 
     * @returns {boolean} true
     * 
     * @example
     * // permanently delete all records in a table
     * mytable.zap();
     *
     */
    LocalTable.prototype.zap = function () {
        if (this._reccount == 0) {
            this._bof = true; // match FPW logic
            return true;
        }

        // delete table records and index entries
        this._table = [];            // actual table data - array of record objects 
        this._reccount = 0;

        // update indexes one by one
        let _nCtr = 0;
        for (_nCtr = 1; _nCtr <= this._indexcount; _nCtr++) {
            // For a Given Index

            // init this._indexdata array for this index
            this._indexdata[_nCtr - 1] = [];

            // create a reference to current index data array
            let _aIndexData = this._indexdata[_nCtr - 1];

            // initialise it so that the index has at least one null entry even if table has no records 
            // recno:1 corresponds to how it is assigned on a new table
            _aIndexData[0] = { indexval: "", recno: 1 }
        }

        // Force BOFEOF and inject empty structure fields in upper layer
        this.forceBofEof();
        return true;
    };


    /**
     * This method creates an index on the local table. The index can be on single column
     * or multiple columns. There can be one or more indexes on a given table at the same
     * time. However, there is always only one current index on a given table at any time,
     * which can be set by methods such as setOrder() and setCurIndex().
     * 
     * An index is used to seek a record quickly using binary tree search based on the given 
     * key values.
     *    
     * @param {string} _cKeyList A list of index keys.
     * 
     * @returns {boolean} This method return true if it is a success. It returns false if
     * there is an error in Index Expression specification.
     * 
     * @example
     * // create a single column index on character key
     * mytable.indexOn("itemcd") ;
     * 
     * // create another index on numeric key
     * mytable.indexOn("stock") ; // creates 2nd index on stock column
     * 
     * // create a composite index (using one character column and one numeric column)
     * mytable.indexOn("itemcd,stock") ; 
     *
     */
    LocalTable.prototype.indexOn = function (_cKeyList) {
        if (_cKeyList == undefined || _cKeyList == "") { return false; }

        // commit data and update existing other indexes (important)
        this.commit();

        _cKeyList = mylib.strtran(_cKeyList, " ", "");
        let _cScope = "thisrecord" ;
        let _cIndexKeyExp = this.bldIndexExp(_cKeyList,_cScope);
        let _fIndexEvalFx = Function("thisrecord", 'return ' + _cIndexKeyExp);

        // update index definition object
        this._indexcount++;
        this._indexdef[this._indexcount - 1] = {indexkeylist : _cKeyList, indexkeyexp : _cIndexKeyExp, indexevalfx : _fIndexEvalFx};
    
        // init this._indexdata array for this index
        this._indexdata[this._indexcount - 1] = [];

        // create a reference to current index data array
        let _aIndexData = this._indexdata[this._indexcount - 1];

        // initialise it so that the index has at least one null entry even if table has no records 
        // recno:1 corresponds to how it is assigned on a new table
        _aIndexData[0] = { indexval: "", recno: 1 };

        let thisrecord = {}; // object to temporarily hold current record 

        // scan the data table and update {indexval: , recno: } for each record
        let _uIndexVal = "";
        let _nRecCtr = 0;

        for (_nRecCtr = 1; _nRecCtr <= this._reccount; _nRecCtr++) {
            // create temporary thisrecord object 
            thisrecord = this._table[_nRecCtr - 1];

            try {
                // _uIndexVal = eval(_cIndexKeyExp);
                _uIndexVal = _fIndexEvalFx(thisrecord);
            } catch (error) {
                mylib.showError("indexOn - Error while evaluating Index Expression, " + error); 
                return false;
            }
            
            // For char string, mysql comparision is case-in-sensitive
            // so, we want to emulate that here too
            // we do it by using two things :
            // 1) Firstly, we store all string keys in upper case in Index Table
            // 2) Then, during binary search on Index Table, we will convert the value being seeked to uppercase 

            // following may not be needed now as the index expression has uppercase conversion built in
            if (typeof _uIndexVal == "string") {
                _uIndexVal = _uIndexVal.toUpperCase();
            }

            _aIndexData[_nRecCtr - 1] = { indexval: _uIndexVal, recno: _nRecCtr };

        }

        // Now, sort the data on indexval
        _aIndexData.sort(function (a, b) {
            // return a.indexval > b.indexval ? 1 : -1;
            return a.indexval > b.indexval ? 1 : a.indexval < b.indexval ? -1 : a.recno < b.recno ? -1 : 1 ;
        });

        // set order to new index
        this._curorder = this._indexcount;
        return true;
    };


    /**
     * A method which builds an index expression using the specified key names and 
     * specified scope.
     * 
     * An Index can have one or more keys - which may be of differnt data types. For a multi key
     * index, it is neccessary to build composite index keys in an appropriate fashion with 
     * appropriate padding and data type conversion - so that the index keys are built in an uniform
     * fashion for all records. The method bldIndexExp() is used to return an index expression, 
     * which can be evaluated for each record in a table to build the actual index. This method is
     * used internally by indexOn() method. It is also used by LocalSql library.
     *
     * @param {string} _cKeyList A string which specifies a list of keys which will make the index. 
     * 
     * @param {string} _cScope   A string with specifies the scope in which Index Expression
     * should be built.  
     * 
     * @returns {string} An index expression using specified keys in specified scope.
     * 
     * @example
     * // return an index expression using specified keys
     *
     * let _cIndexKeyExp = mytable.bldIndexExp("itemcd,stock", "thisrecord") ; 
     * 
     */
    LocalTable.prototype.bldIndexExp = function (_cKeyList, _cScope) {
        if (_cKeyList == undefined || _cKeyList == "") { return ""; }
        if (_cScope == undefined) {
            _cScope = "";
        } else {
            _cScope = _cScope.trim() + ".";
        }

        _cKeyList = mylib.strtran(_cKeyList, " ", "");

        let _aKeyList = [];
        _aKeyList = _cKeyList.split(","); // split key names in the list to an array eg. "itemcd,qty" -> array

        // Build Index Expression
        let _nKeys = _aKeyList.length;    // number of key names in given key list
        let _cKeyName = ""
        let _cIndexKeyExp = "";

        let _aStruct = this._astructdef;
        let _nStruLen = _aStruct.length;

        let _oFldStru = {};
        let _cPropId = "";
        let _cDataType = "";
        let _nFldLen = 0;
        let _nDecLen = 0;

        let _nCtr = 0;
        for (_nCtr = 1; _nCtr <= _nKeys; _nCtr++) {
            _cKeyName = _aKeyList[_nCtr - 1].trim(); // get a key from array
            _cDataType = "";
            _nFldLen = 0;
            _nDecLen = 0;

            // find its datatype and length from structure 
            let _nCtr1 = 0;
            for (_nCtr1 = 0; _nCtr1 <= _nStruLen - 1; _nCtr1++) {
                _oFldStru = _aStruct[_nCtr1];
                // _oFldStru = {fieldname:"itemcd",datatype:"C",len:15,dec:0}
                _cPropId = _oFldStru.fieldname.trim();

                if (_cPropId == _cKeyName) {
                    _cDataType = _oFldStru.datatype;
                    _nFldLen = _oFldStru.len;
                    _nDecLen = _oFldStru.dec;

                    if (_cDataType == "D") {
                        _nFldLen = 10;
                    }

                    break;
                }
            } // endfor


            // Note : we should not normally index on object as JSON.stringify of object will keep giving 
            // different length for different records. However, we may need it sometimes , for example to
            // check distinct records in localsql 

            // check for allowed data types in index keys
            if (_cDataType == "C" || _cDataType == "D" || _cDataType == "N" || _cDataType == "F" ||  _cDataType == "L" ||  _cDataType == "O") {
                // it is ok
            } else {
                mylib.showError("LocalTable.bldIndexExp method : invalid key data type  " + _cDataType);
                continue;
            }


            // Build Index Expression
            if (_cDataType == "C" || _cDataType == "D") {
                // we convert to uppercase, so that operation which involve seek or lhs = rhs work properly 
                _cIndexKeyExp = _cIndexKeyExp + _cScope + _cKeyName + ".toUpperCase().padEnd(" + _nFldLen.toString() + ")";
                // _cIndexKeyExp = _cIndexKeyExp + _cScope + _cKeyName + ".padEnd(" + _nFldLen.toString() + ")";
            }

            if (_cDataType == "N"  || _cDataType == "F") {
                if (_nKeys == 1) {
                    // if only key , no issue, else convert to string with proper size
                    _cIndexKeyExp = _cScope + _cKeyName;

                } else {
                    _cIndexKeyExp = _cIndexKeyExp + "mylib.convNum2StrIdx(" + _cScope  + _cKeyName + "," + _nFldLen.toString() + "," + _nDecLen.toString() + ")";
                }
            }

            if (_cDataType == "L") {
                _cIndexKeyExp = _cIndexKeyExp + "mylib.l2Str(" + _cScope  + _cKeyName + ")";
            }

            // Note : we should not normally index on object as JSON.stringify of object will keep giving 
            // different length for different records. However, we may need it sometimes , for example to
            // check distinct records in localsql 
            if (_cDataType == "O" ) {
                _cIndexKeyExp = _cIndexKeyExp + "JSON.stringify(" + _cScope  + _cKeyName + ")";
            }
            
            if (_nCtr < _nKeys) {
                _cIndexKeyExp = _cIndexKeyExp + " + ";
            }
        } // endfor

        return _cIndexKeyExp;
    };

    /**
     * A method which builds a value expression using the specified value field list and a
     * specified scope. This method uses a specified key fields list to infer data type & size
     * of fields to create a correct value expression equivalent to the index key expression.
     * 
     * @param {string} _cKeyList A string which specifies a list of keys which make the index. 
     * 
     * @param {string} _cValFldList A string which specifies a list of value fields for which 
     * we want to build a value expression.  
     * 
     * @param {string} [_cScope=""] An optional string with specifies the scope in which value expression
     * should be built.  
     * 
     * @param {boolean} [_lPartialKey=false] An optional logical value which is passed as true if we are building 
     * a value expression which will be used in partial seek using an index which has multiple numeric key fields.
     * 
     * @returns {string} A value expression using specified value fields list in the specified scope.
     * 
     * @example
     * // return a value expression using specified keys in the scope of m
     * let m = {};
     * m.itemcd = "C001";
     * m.stock = 400;  
     * 
     * // build a key value expression using the index expression template
     * let _cKeyValueExp = mytable.bldValueExp("itemcd,stock", "m.itemcd,m.stock"); 
     * // get the properly padded key value by evaling the key value expression  
     * let _cKeyValue = eval(_cKeyValueExp) ; 
     * 
     * // find the record using composite keys
     * mytable.setOrder(3); // set appropriate current index order 
     * let _lResult = mytable.seek(_cKeyValue) ; 
     */
    LocalTable.prototype.bldValueExp = function (_cKeyList, _cValFldList, _cScope, _lPartialKey) {
        if (_cKeyList == undefined || _cKeyList == "") { return ""; }

        if (_cScope == undefined)  {
            _cScope = "";
        } else {
            _cScope = _cScope.trim() + ".";
        }

        if (_lPartialKey == undefined) {
            _lPartialKey = false;
        }

        _cKeyList = mylib.strtran(_cKeyList, " ", "");

        let _aKeyList = [];
        _aKeyList = _cKeyList.split(","); // split key names in the list to an array eg. "itemcd,qty" -> array

        let _aValFldList = [];
        _aValFldList = _cValFldList.split(","); // split Value Field names in the list to an array eg. "itemcd,qty" -> array
        
        // Build value expression based on the datatype, len, dec template of respective key fields 
        let _nKeys = _aKeyList.length;    // number of key names in given key list
        let _cKeyName = "";
        // let _cIndexKeyExp = "";

        let _aStruct = this._astructdef;
        let _nStruLen = _aStruct.length;

        let _oFldStru = {};
        let _cPropId = "";
        let _cDataType = "";
        let _nFldLen = 0;
        let _nDecLen = 0;

        let _cValFld    = "" ;
        let _cKeyValueExp = "";

        let _nCtr = 0;
        for (_nCtr = 1; _nCtr <= _nKeys; _nCtr++) {
            _cKeyName = _aKeyList[_nCtr - 1].trim(); // get a key from array
            _cValFld = _aValFldList[_nCtr - 1].trim(); // get a key from array
    
            _cDataType = "";
            _nFldLen = 0;
            _nDecLen = 0;

            // find its datatype and length from structure 
            let _nCtr1 = 0;
            for (_nCtr1 = 0; _nCtr1 <= _nStruLen - 1; _nCtr1++) {
                _oFldStru = _aStruct[_nCtr1];
                // _oFldStru = {fieldname:"itemcd",datatype:"C",len:15,dec:0}
                _cPropId = _oFldStru.fieldname.trim();

                if (_cPropId == _cKeyName) {
                    _cDataType = _oFldStru.datatype;
                    _nFldLen = _oFldStru.len;
                    _nDecLen = _oFldStru.dec;

                    if (_cDataType == "D") {
                        _nFldLen = 10;
                    }

                    break;
                }
            } // endfor

            // check for allowed data types in index keys
            if (_cDataType == "C" || _cDataType == "D" || _cDataType == "N") {
                // it is ok
            } else {
                mylib.showError("LocalTable.bldValueExp method : invalid key data type  " + _cDataType);
            }

            // Build Index Expression
            if (_cDataType == "C" || _cDataType == "D") {
                // we convert to uppercase, so that operation which involve seek or lhs = rhs work properly 
                // _cIndexKeyExp = _cIndexKeyExp + _cScope + _cKeyName + ".toUpperCase().padEnd(" + _nFldLen.toString() + ")";
                _cKeyValueExp = _cKeyValueExp + _cScope + _cValFld + ".toUpperCase().padEnd(" + _nFldLen.toString() + ")";
            }

            if (_cDataType == "N") {
                if (_nKeys == 1 && (! _lPartialKey)) {
                    // if only key , no issue, else convert to string with proper size
                    // _cIndexKeyExp = _cScope + _cKeyName;
                    _cKeyValueExp = _cScope + _cValFld;

                } else {
                    // _cIndexKeyExp = _cIndexKeyExp + "mylib.convNum2StrIdx(" + _cScope  + _cKeyName + "," + _nFldLen.toString() + "," + _nDecLen.toString() + ")";
                    _cKeyValueExp = _cKeyValueExp + "mylib.convNum2StrIdx(" + _cScope  + _cValFld + "," + _nFldLen.toString() + "," + _nDecLen.toString() + ")";
                }
            }

            if (_nCtr < _nKeys) {
                _cKeyValueExp = _cKeyValueExp + " + ";
            }
        } // endfor

        return _cKeyValueExp;
    };


    // private function
    LocalTable.prototype.goIndexedTop = function (_lNoCommit) {
        if (_lNoCommit == undefined) {
            _lNoCommit = false;
        }

        if (_lNoCommit == false) {
            this.commit();
        }

        if (this._curorder <= 0) {
            // no current index
            mylib.showError("No current Index for goIndexedTop");
            return false;
        }

        if (this._reccount == 0) {
            this._bof = true; // match FPW logic
            return false;
        }

        // goIndexedTop is certainly affected by setDeletedOn or setDeletedOff or setFilter

        // create a reference to index data array
        let _aIndexData = this._indexdata[this._curorder - 1];
        let _nActRecNo = 0;

        // patch to take care that an indexed read is performed before commit - so index is not upto date in such case
        if (_aIndexData.length < this._reccount) {
            this.commit();
        }
        
        // if this._setdeleted is false and there is no filter condition, then go to first record by index 
        if (this._setdeleted == false && this._filtercond.length == 0) {
            _nActRecNo = _aIndexData[0].recno;
            return this.goTo(_nActRecNo, true);
        }

        // either setdeleted is true or filter condition is present
        // find first record which satisfies the given criterion
        let _nFirstRec = 0;
        let thisrecord = {}; // object to temporarily hold current record 

        let _nIndxRecNo = 0;
        for (_nIndxRecNo = 1; _nIndxRecNo <= this._reccount; _nIndxRecNo++) {
            // get the index entry for nth record in the index
            _nActRecNo = _aIndexData[_nIndxRecNo - 1].recno;

            if (this._setdeleted == true && this._table[_nActRecNo - 1]._deleted == true) {
                // setdeleted is true and this record is a deleted record , so skip it
                continue;
            }

            if (this._filtercond.length > 0) {
                // evaluate filter condition, if fails skip it
                // filter like "qty > 0" is already transformed to "thisrecord.qty > 0" in this._filtercond

                // create temporary thisrecord object 
                thisrecord = this._table[_nActRecNo - 1];

                // if (eval(this._filtercond) == false) {
                //     continue;
                // }
                if (this._filterevalfx(thisrecord) == false) {
                    continue;
                }
            }

            _nFirstRec = _nActRecNo;
            break;
        }

        if (_nFirstRec > 0) {
            return this.goTo(_nFirstRec, true);
        }

        // No First record Available, Force BOFEOF 
        this.forceBofEof();
        this._bof = false;  // to match logic with FPW
        return false;
    };

    // private function
    LocalTable.prototype.goIndexedBottom = function (_lNoCommit) {
        if (_lNoCommit == undefined) {
            _lNoCommit = false;
        }

        if (_lNoCommit == false) {
            this.commit();
        }

        if (this._curorder <= 0) {
            // no current index
            mylib.showError("No current Index for goIndexedBottom");
            return false;
        }

        if (this._reccount == 0) {
            this._bof = true; // match FPW logic
            return false;
        }

        // goIndexedBottom is certainly affected by setDeletedOn or setDeletedOff or setFilter

        // create a reference to index data array
        let _aIndexData = this._indexdata[this._curorder - 1];
        let _nActRecNo = 0;

        // patch to take care that an indexed read is performed before commit - so index is not upto date in such case
        if (_aIndexData.length < this._reccount) {
            this.commit();
        }
        
        // if this._setdeleted is false and there is no filter condition, then go to last record by index 
        if (this._setdeleted == false && this._filtercond.length == 0) {
            _nActRecNo = _aIndexData[this._reccount - 1].recno;
            return this.goTo(_nActRecNo, true);
        }

        // either setdeleted is true or filter condition is present
        // find first record from bottom which satisfies the given criterion
        let _nFirstRec = 0;
        let thisrecord = {}; // object to temporarily hold current record 

        let _nIndxRecNo = 0;
        for (_nIndxRecNo = this._reccount; _nIndxRecNo > 0; _nIndxRecNo--) {
            // get the index entry for nth record in the index
            _nActRecNo = _aIndexData[_nIndxRecNo - 1].recno;

            if (this._setdeleted == true && this._table[_nActRecNo - 1]._deleted == true) {
                // setdeleted is true and this record is a deleted record , so skip it
                continue;
            }

            if (this._filtercond.length > 0) {
                // evaluate filter condition, if fails skip it
                // filter like "qty > 0" is already transformed to "thisrecord.qty > 0" in this._filtercond

                // create temporary thisrecord object 
                thisrecord = this._table[_nActRecNo - 1];

                // if (eval(this._filtercond) == false) {
                //     continue;
                // }
                if (this._filterevalfx(thisrecord) == false) {
                    continue;
                }
            }

            _nFirstRec = _nActRecNo;
            break;
        }

        if (_nFirstRec > 0) {
            return this.goTo(_nFirstRec, true);
        }

        // No such First record Available, Force BOFEOF 
        this.forceBofEof();
        return false;
    };

    // private function
    LocalTable.prototype.indexedSkip = function (_nRecs, _lNoCommit) {
        if (_lNoCommit == undefined) {
            _lNoCommit = false;
        }

        if (_lNoCommit == false) {
            this.commit();
        }

        if (this._curorder <= 0) {
            // no current index
            mylib.showError("No current Index for indexedSkip");
            return false;
        }

        if (_nRecs == undefined) {
            _nRecs = 1;
        }

        if (_nRecs == 0) { return false; }

        if (this._reccount == 0) {
            this._bof = true; // match FPW logic
            return false;
        }

        // go to index entry corresonding to current record in selected index
        let _nIndxRecNo = 0;                                    // Index entry no
        let _aIndexData = this._indexdata[this._curorder - 1];  // create a reference to selected index data array
        let _nActRecNo = 0;                                     // actual recordno in table as given by _aIndexData[indexptr].recno 
    
        // patch to take care that an indexed read is performed before commit - so index is not upto date in such case
        if (_aIndexData.length < this._reccount) {
            this.commit();
        }

        for (_nIndxRecNo = 1; _nIndxRecNo <= this._reccount; _nIndxRecNo++) {
            // get the index entry for nth record in the index
            _nActRecNo = _aIndexData[_nIndxRecNo - 1].recno;
            if (_nActRecNo == this._recno) {
                // now we are are at an index entry corresponding to the current record     
                break;
            }
        }

        if (_nActRecNo != this._recno) {
            // we could not find any index entry corresponding to current record
            if (this.eof() == true) {
                _nIndxRecNo = this._reccount + 1;
            } else {
                mylib.showError("indexedSkip - Error : could not find any index entry corresponding to current record");
                this.goBottom(true);
                return false;
            }
        }

        // _nRecs can be +ve or -ve integer , i.e. skip(1) , skip(-2)

        // indexedSkip is certainly affected by setDeletedOn or setDeletedOff or setFilter
        // either setdeleted is true or filter condition is present
        // find first record which satisfies the criteria by skipping at least _nRecs records in index
        let _nFirstRec = 0;
        let thisrecord = {}; // object to temporarily hold current record 

        if (_nRecs > 0) {
            // scan in forward direction
            for (_nIndxRecNo = _nIndxRecNo + _nRecs; _nIndxRecNo <= this._reccount; _nIndxRecNo++) {
                // get the index entry for nth record in the index

                // TODO ??
                _nActRecNo = _aIndexData[_nIndxRecNo - 1].recno;

                if (this._setdeleted == true && this._table[_nActRecNo - 1]._deleted == true) {
                    // setdeleted is true and this record is a deleted record , so skip it
                    continue;
                }

                if (this._filtercond.length > 0) {
                    // evaluate filter condition, if fails skip it
                    // filter like "qty > 0" is already transformed to "thisrecord.qty > 0" in this._filtercond

                    // create temporary thisrecord object 
                    thisrecord = this._table[_nActRecNo - 1];

                    // if (eval(this._filtercond) == false) {
                    //     continue;
                    // }
                    if (this._filterevalfx(thisrecord) == false) {
                        continue;
                    }
                }

                _nFirstRec = _nActRecNo;
                break;
            }

            if (_nFirstRec > 0) {
                return this.goTo(_nFirstRec, true);
            }

            // No First record available, Force BOFEOF 
            this.forceBofEof();
            this._bof = false;  // to match logic with FPW
            return false;
        }

        if (_nRecs < 0) {
            // scan in backward direction
            for (_nIndxRecNo = _nIndxRecNo + _nRecs; _nIndxRecNo > 0; _nIndxRecNo--) {
                // get the index entry for nth record in the index
                _nActRecNo = _aIndexData[_nIndxRecNo - 1].recno;

                if (this._setdeleted == true && this._table[_nActRecNo - 1]._deleted == true) {
                    // setdeleted is true and this record is a deleted record , so skip it
                    continue;
                }

                if (this._filtercond.length > 0) {
                    // evaluate filter condition, if fails skip it
                    // filter like "qty > 0" is already transformed to "thisrecord.qty > 0" in this._filtercond

                    // create temporary thisrecord object 
                    thisrecord = this._table[_nActRecNo - 1];

                    // if (eval(this._filtercond) == false) {
                    //     continue;
                    // }
                    if (this._filterevalfx(thisrecord) == false) {
                        continue;
                    }
                }

                _nFirstRec = _nActRecNo;
                break;
            }

            if (_nFirstRec > 0) {
                return this.goTo(_nFirstRec, true);
            }

            // special logic : can not do skip -n to a record which meets the condition. 
            // So, try to go to top record which meets the condition.
            // go to top record, but _lNoCommit = true
            if (this.goTop(true) == true) {
                this._bof = true;
                return false;
            }

            // No First record , nor top record Available, Force BOFEOF 
            this.forceBofEof();
            return false;
        }
    };


    // private function
    LocalTable.prototype.indexedLocate = function (_cCondExpr, _lNoCommit) {
        if (_lNoCommit == undefined) {
            _lNoCommit = false;
        }

        if (_lNoCommit == false) {
            this.commit();
        }

        if (this._curorder <= 0) {
            // no current index
            mylib.showError("No current Index for indexedLocate");
            return false;
        }

        if (_cCondExpr == undefined || _cCondExpr == "") {
            mylib.showError("Error : no locate condition specified in locate call");
            return false;
        }

        if (this._reccount == 0) {
            this._bof = true; // match FPW logic
            return false;
        }

        let _cNewCondExpr = this.reformCondition(_cCondExpr);
        if (_cNewCondExpr == "") { return false; }
        let _fNewCondEvalFx =  Function('thisrecord', 'return ' + _cNewCondExpr);


        // locate is certainly affected by setDeletedOn or setDeletedOff or setFilter
        // find first record which satisfies the criteria 
        let _nFirstRec = 0;
        let thisrecord = {}; // object to temporarily hold current record 

        // create a reference to index data array
        let _aIndexData = this._indexdata[this._curorder - 1];
        let _nActRecNo = 0;

        // patch to take care that an indexed read is performed before commit - so index is not upto date in such case
        if (_aIndexData.length < this._reccount) {
            this.commit();
        }

        // scan in forward direction from first index entry
        let _nIndxRecNo = 0;
        for (_nIndxRecNo = 1; _nIndxRecNo <= this._reccount; _nIndxRecNo++) {
            // get the index entry for nth record in the index
            _nActRecNo = _aIndexData[_nIndxRecNo - 1].recno;

            if (this._setdeleted == true && this._table[_nActRecNo - 1]._deleted == true) {
                // setdeleted is true and this record is a deleted record , so skip it
                continue;
            }

            // create temporary thisrecord object 
            thisrecord = this._table[_nActRecNo - 1];

            if (this._filtercond.length > 0) {
                // evaluate filter condition, if fails skip it
                // filter like "qty > 0" is already transformed to "thisrecord.qty > 0" in this._filtercond
                // if (eval(this._filtercond) == false) {
                //     continue;
                // }
                if (this._filterevalfx(thisrecord) == false) {
                    continue;
                }
            }

            try {
                // if (eval(_cNewCondExpr) == true) {
                //     _nFirstRec = _nActRecNo;
                //     break;
                // }

                if ( _fNewCondEvalFx(thisrecord) == true) {
                    _nFirstRec = _nActRecNo;
                    break;
                }
            } catch (error) {
                mylib.showError("indexedLocate - Error while evaluating locate Condition Expression, " + error); 
                return false;
            }


        } // endfor

        if (_nFirstRec > 0) {
            return this.goTo(_nFirstRec, true);
        }

        // No First record Available, Force BOFEOF 
        this.forceBofEof();
        this._bof = false;  // to match logic with FPW
        return false;
    };


    /**
     * A method to seek a record in local table using binary search on the current index
     * (which is based on some keys) by using the specified value of the index key(s) 
     * expression.
     *  
     * We must select the correct index order before using this method.
     * 
     * @param {*} _uSeekValue The value of the index keys(s) for which we want to find
     * the record using the current index.
     * 
     * @param {boolean} [_lNoCommit=false] As a local table field for a current record can simply be
     * updated by an assignment statement, the LocalTable system does not know about such 
     * updates. Therefore, the LocalTable system always tries to commit the current record to
     * the actual table before moving the record pointer. The commit operation also updates all
     * indexes.
     * 
     * Thus, this flag provides a mechanism to omit unwanted commits and optimise the 
     * operation. The default for this flag is false, which implies that the current record
     * should be committed before carrying out this operation. However, one can set this flag 
     * to true to specify that current record need not be committed before moving the current
     * record pointer as no update is done on the current record. 
     * 
     * @returns {boolean} It returns true if the record is found. It returns false if no current index
     * is set on the table or if the table is empty or if the seek value is not passed.
     * 
     * @example
     *   
     * // seek a record using character value key
     * m.itemcd = "V001";
     * mytable.setOrder(1);
     * let _lResult = mytable.seek(m.itemcd) ; // finds the record using index on itemcd column
     * 
     * // access record using numeric key
     * m.stock = 100;
     * mytable.setOrder(2);
     * let _lResult = mytable.seek(m.stock) ; // finds the record using index on stock column
     *
     * // access record using composite key
     * let m = {}; 
     * m.itemcd = "C001";
     * m.stock = 400;  
     * 
     * // build a key value expression using the index expression template
     * let _cKeyValueExp = mytable.bldValueExp("itemcd,stock", "m.itemcd,m.stock"); 
     * // get the key value by evaling the key value expression  
     * let _cKeyValue = eval(_cKeyValueExp) ; 
     * 
     * // find the record using composite keys
     *  mytable.setCurIndex("itemcd,stock"); // set appropriate current index
     *  let _lResult = mytable.seek(_cKeyValue) ; 
     * 
     */
    LocalTable.prototype.seek = function (_uSeekValue, _lNoCommit) {
        if (_lNoCommit == undefined) {
            _lNoCommit = false;
        }

        if (_lNoCommit == false) {
            this.commit();
        }

        if (this._curorder <= 0) {
            // no current index
            mylib.showError("No current Index for seek");
            return false;
        }

        if (_uSeekValue == undefined) { 
            mylib.showError("SeekValue not specified in seek");
            return false;
        }

        if (this._reccount == 0) {
            this._bof = false; // match FPW logic - on seek bof() is false
            return false;
        }


        // seek is certainly affected by setDeletedOn or setDeletedOff or setFilter
        // find first record which satisfies the criteria 
        let _nFirstRec = 0;
        let thisrecord = {}; // object to temporarily hold current record 

        // create a reference to index data array
        let _aIndexData = this._indexdata[this._curorder - 1];
        let _nActRecNo = 0;

        // patch to take care that an indexed read is performed before commit - so index is not upto date in such case
        if (_aIndexData.length < this._reccount) {
            this.commit();
        }

        let startIndex = 0;
        let stopIndex = _aIndexData.length - 1;
        let middle = Math.floor((stopIndex + startIndex) / 2);

        if (typeof _uSeekValue == "number" && typeof _aIndexData[0].indexval == "number") {
            while (_uSeekValue != _aIndexData[middle].indexval && startIndex < stopIndex) {

                // adjust search area
                if (_uSeekValue < _aIndexData[middle].indexval) {
                    stopIndex = middle - 1;
                } else if (_uSeekValue > _aIndexData[middle].indexval) {
                    startIndex = middle + 1;
                }

                // recalculate middle
                middle = Math.floor((stopIndex + startIndex) / 2);

                if (middle < 0) {
                    break;
                }
            }

            // make sure it's the right value
            if (middle < 0) {
                // do not check - bcuz it will give subscript error
            } else {    
                middle = _uSeekValue != _aIndexData[middle].indexval ? -1 : middle;
            }
            
            
            // no match
            if (middle == -1) {
                // force a eof 
                this.forceBofEof();
                this._bof = false;  // to match logic with FPW
                return false;
            } else {
                // we have a match in index, there may be a prior index entry for same key - if so try to go there
                let _nNewMiddle = 0;
                for (_nNewMiddle = middle - 1; _nNewMiddle >= 0; _nNewMiddle--) {
                    if (_uSeekValue != _aIndexData[_nNewMiddle].indexval) {
                        // key changed just now while going prior
                        // so previous key was first key
                        middle = _nNewMiddle + 1;
                        break;
                    }
                }
            }

            // get the actual record no 
            let _nSeekRec = _aIndexData[middle].recno;

            // checked deleted/set filter etc, if yes then look nearby in forward direction
            if (this._setdeleted == false && this._filtercond.length == 0) {
                return this.goTo(_nSeekRec, true);
            }

            let _lCheckNear = false;
            if (this._setdeleted == true && this._table[_nSeekRec - 1]._deleted == true) {
                // setdeleted is true and this record is a deleted record  
                _lCheckNear = true;
            }


            // create temporary thisrecord object 
            thisrecord = this._table[_nSeekRec - 1];
            if (this._filtercond.length > 0) {
                // evaluate filter condition, if fails skip it
                // filter like "qty > 0" is already transformed to "thisrecord.qty > 0" in this._filtercond
                // if (eval(this._filtercond) == false) {
                //     _lCheckNear = true;
                // }
                if (this._filterevalfx(thisrecord) == false) {
                    _lCheckNear = true;
                }
            }

            if (_lCheckNear == false) {
                return this.goTo(_nSeekRec, true);
            }


            let _nCurIndxRec = middle + 1; // non zero relative

            // check nearby
            // check forward from _nSeekRec till key value changes
            _nFirstRec = 0;
            let _nIndxRecNo = 0;
            for (_nIndxRecNo = _nCurIndxRec + 1; _nIndxRecNo <= this._reccount; _nIndxRecNo++) {
                if (_uSeekValue != _aIndexData[_nIndxRecNo - 1].indexval) {
                    break;
                }

                // get the actual record no in table
                _nActRecNo = _aIndexData[_nIndxRecNo - 1].recno;

                if (this._setdeleted == true && this._table[_nActRecNo - 1]._deleted == true) {
                    // setdeleted is true and this record is a deleted record , so skip it
                    continue;
                }

                // create temporary thisrecord object 
                thisrecord = this._table[_nActRecNo - 1];
                if (this._filtercond.length > 0) {
                    // evaluate filter condition, if fails skip it
                    // filter like "qty > 0" is already transformed to "thisrecord.qty > 0" in this._filtercond
                    // if (eval(this._filtercond) == false) {
                    //     continue;
                    // }
                    if (this._filterevalfx(thisrecord) == false) {
                        continue;
                    }
                }

                _nFirstRec = _nActRecNo;
                break;
            } // endfor

            if (_nFirstRec > 0) {
                return this.goTo(_nFirstRec, true);
            }

            // No Nearby record found which meets the seek Expr   
            // force a eof 
            this.forceBofEof();
            this._bof = false;  // to match logic with FPW
            return false;
        }


        if (typeof _uSeekValue == "string" && typeof _aIndexData[0].indexval == "string") {
            _uSeekValue = _uSeekValue.toUpperCase();
            let _nMatchLen = _uSeekValue.length;

            while (_uSeekValue != _aIndexData[middle].indexval.substr(0, _nMatchLen) && startIndex < stopIndex) {
                // adjust search area
                if (_uSeekValue < _aIndexData[middle].indexval.substr(0, _nMatchLen)) {
                    stopIndex = middle - 1;
                } else if (_uSeekValue > _aIndexData[middle].indexval.substr(0, _nMatchLen)) {
                    startIndex = middle + 1;
                }

                // recalculate middle
                middle = Math.floor((stopIndex + startIndex) / 2);

                if (middle < 0) {
                    break;
                }
            }

            // make sure it's the right value
            if (middle < 0) {
                // do not check - bcuz it will give subscript error
            } else {    
                middle = _uSeekValue != _aIndexData[middle].indexval.substr(0, _nMatchLen) ? -1 : middle;
            }


            // no match
            if (middle == -1) {
                // force a eof 
                this.forceBofEof();
                this._bof = false;  // to match logic with FPW
                return false;
            } else {
                // we have a match in index, there may be a prior index entry for same key - if so try to go there
                let _nNewMiddle = 0; 
                for (_nNewMiddle = middle - 1; _nNewMiddle >= 0; _nNewMiddle--) {
                    if (_uSeekValue !== _aIndexData[_nNewMiddle].indexval.substr(0, _nMatchLen)) {
                        // key changed just now while going prior
                        // so previous key was first key
                        middle = _nNewMiddle + 1;
                        break;
                    } else {
                        // no key change
                        if (_nNewMiddle == 0) {
                            // but we are on first record (boundary condition)
                            // patch : Apr 8, 2019
                            middle = 0;
                        } 
                    }
                }

            }


            // get the actual record no 
            let _nSeekRec = _aIndexData[middle].recno;

            // checked deleted/set filter etc, if yes then look nearby in forward direction
            if (this._setdeleted == false && this._filtercond.length == 0) {
                return this.goTo(_nSeekRec, true);
            }

            let _lCheckNear = false;
            if (this._setdeleted == true && this._table[_nSeekRec - 1]._deleted == true) {
                // setdeleted is true and this record is a deleted record 
                _lCheckNear = true;
            }

            // create temporary thisrecord object 
            thisrecord = this._table[_nSeekRec - 1];
            if (this._filtercond.length > 0) {
                // evaluate filter condition, if fails skip it
                // filter like "qty > 0" is already transformed to "thisrecord.qty > 0" in this._filtercond
                // if (eval(this._filtercond) == false) {
                //     _lCheckNear = true;
                // }
                if (this._filterevalfx(thisrecord) == false) {
                _lCheckNear = true;
                }
            }

            if (_lCheckNear == false) {
                return this.goTo(_nSeekRec, true);
            }

            let _nCurIndxRec = middle + 1; // non zero relative

            // check nearby
            // check forward from _nSeekRec till key value changes
            _nFirstRec = 0;
            let _nIndxRecNo = 0;
            for (_nIndxRecNo = _nCurIndxRec + 1; _nIndxRecNo <= this._reccount; _nIndxRecNo++) {
                if (_uSeekValue != _aIndexData[_nIndxRecNo - 1].indexval.substr(0, _nMatchLen)) {
                    break;
                }

                // get the actual record no in table
                _nActRecNo = _aIndexData[_nIndxRecNo - 1].recno;

                if (this._setdeleted == true && this._table[_nActRecNo - 1]._deleted == true) {
                    // setdeleted is true and this record is a deleted record , so skip it
                    continue;
                }

                // create temporary thisrecord object 
                thisrecord = this._table[_nActRecNo - 1];
                if (this._filtercond.length > 0) {
                    // evaluate filter condition, if fails skip it
                    // filter like "qty > 0" is already transformed to "thisrecord.qty > 0" in this._filtercond
                    // if (eval(this._filtercond) == false) {
                    //     continue;
                    // }
                    if (this._filterevalfx(thisrecord) == false) {
                        continue;
                    }
                }

                _nFirstRec = _nActRecNo;
                break;
            } // endfor


            if (_nFirstRec > 0) {
                return this.goTo(_nFirstRec, true);
            }

            // No Nearby record found which meets the seek Expr   
            // force a eof 
            this.forceBofEof();
            this._bof = false;  // to match logic with FPW
            return false;
        }


        // Invalid Seek Expr, Force BOFEOF 
        this.forceBofEof();
        this._bof = false;  // to match logic with FPW
        return false;
    };


    /**
     * A method which returns the current index order.
     * 
     * @returns {number} A numeric value which returns the index sequence number of the
     * current index relative to zero. A value of zero would mean no current index, while a
     * value n signifies that nth index is the currently active index.
     * 
     * @example
     * // check current index order
     * let _nCurIndxSeq = mytable.curOrder();
     */
    LocalTable.prototype.curOrder = function () { return this._curorder; } ;

    /**
     * A method which sets the current index to the specified index number.
     * 
     * @param {number} _nOrder  A numeric value which sepcifies the index sequence number of
     * the current index relative to 0. A value of 0 would mean no current index, while a
     * value n signifies the nth index.
     * 
     * @returns {boolean} true.
     * 
     * @example
     * // set current index using indexnumber 
     * mytable.setOrder(2);  // set current index to 2nd index which is on stock column
     *  
     */
    LocalTable.prototype.setOrder = function (_nOrder) {
        if (_nOrder == undefined) { return false; }

        // special logic to set current order to -1, so that we can append data in a loop 
        // without updating index for each record 
        if (_nOrder == -1) {
            this._curorder = _nOrder;
            return true;
        }

        if (_nOrder < 0 || _nOrder > this._indexcount) { return false; }
        this._curorder = _nOrder;
        return true;
    };


    /**
     * A method which returns the Index Keys list for the specified index sequence.
     * 
     * @param {number} _nIndexNo A numeric value which returns the index sequence number of 
     * the index relative to 0. A value of 0 would mean no current index, while a value n 
     * signifies that nth index is the currently active index.
     *  
     * @returns {string} The Index keys list.
     * 
     * @example
     * // find the index keys for 3rd index 
     * let _cIndexKeyList = mytable.indexkeylist(3);
     */
    LocalTable.prototype.indexkeylist = function (_nIndexNo) {
        if (_nIndexNo == undefined) {
            _nIndexNo = this._curorder;
        }

        if (_nIndexNo == 0 || _nIndexNo > this._indexcount) {
            return "";
        } else {
            return this._indexdef[_nIndexNo - 1].indexkeylist;
        }
    };

    /**
     * A method which sets the current index to an index whose keys correspond to the 
     * specified keys list.
     * 
     * @param {string} _cKeyList The key list corresponding to which the current index is to be set.
     * 
     * @returns {boolean} This function returns true if an index matching the given key list
     * was found and set as current index, otherwise it returns false. 
     * 
     * @example
     * // set current index using keylist instead of index seq number
     * mytable.setCurIndex("itemcd,stock");
     */
    LocalTable.prototype.setCurIndex = function (_cKeyList) {
        if (_cKeyList == undefined || _cKeyList == "") { return false; }
        _cKeyList = mylib.strtran(_cKeyList, " ", "");

        let _nOrder = 0;

        // first try exact match
        let _nCtr = 0;
        for (_nCtr = 1; _nCtr <= this._indexcount; _nCtr++) {
            if (this._indexdef[_nCtr - 1].indexkeylist == _cKeyList) {
                _nOrder = _nCtr;
                break;
            }
        }

        // then try partial match
        if (_nOrder == 0) {
            _cKeyList = _cKeyList + ",";
            let _nMatchLen = _cKeyList.length;
            for (_nCtr = 1; _nCtr <= this._indexcount; _nCtr++) {
                if (_cKeyList == this._indexdef[_nCtr - 1].indexkeylist.substr(0,_nMatchLen) ) {
                    _nOrder = _nCtr;
                    break;
                }
            }
        }
        
        this._curorder = _nOrder;

        if (_nOrder > 0 ) {
            return true;
        } else {
            return false;
        }
    };


    /**
     * A method to find the total number of indexes defined on a table.
     * 
     * @returns {number} A numeric value which specifies how many indexes are defined on the
     * table.
     * 
     * @example
     * // find the total number of indexes on a table
     * let _nTotIndx = mytable.indexcount();
     */
    LocalTable.prototype.indexcount = function () { return this._indexcount; }


    // private function 
    LocalTable.prototype.indexkeyexp = function (_nIndexNo) {
        if (_nIndexNo == undefined) {
            _nIndexNo = this._curorder;
        }

        if (_nIndexNo == 0 || _nIndexNo > this._indexcount) {
            return "";
        } else {
            return this._indexdef[_nIndexNo - 1].indexkeyexp;
        }
    };

    /**
     * A method to re-create or re-build all indexes for a local table.
     * 
     * This method is usually called after a bulk loading of a table. Before bulk loading,
     * we set the current index order to -1 to tell the system to not simultaneously update
     * the indexes as each record is added to the table. This speeds up the bulk loading
     * operations. After bulk loading is over, we can call this method to re-build all indexes.
     * 
     * @returns {boolean} This method always returns true.
     * 
     * @example
     * // uploading data without updating indexes and then reindex all indexes
     * mytable.setOrder(-1); // if current index seq is -1, the system will not update indexes as we update data 
     * mytable.insertInto{itemcd: m.itemcd, itemname: m.itemname, stock: m.stock});  // we can do many inserts like this
     * 
     * // do several inserts similar to above and then reindex
     * mytable.reindex(); // reindex the table after having done all inserts
     * 
     */
    LocalTable.prototype.reindex = function () {
        // commit data without updating indexes, as we will reindex anyway
        this.commit(true);

        // update indexes one by one
        let _nCtr = 0;
        for (_nCtr = 1; _nCtr <= this._indexcount; _nCtr++) {
            // For a Given Index

            // get its index expression
            let _cIndexKeyExp = this._indexdef[_nCtr - 1].indexkeyexp;

            // get its index evaluator fx
            let _fIndexEvalFx = this._indexdef[_nCtr - 1].indexevalfx ;

            // init this._indexdata array for this index
            this._indexdata[_nCtr - 1] = [];

            // create a reference to current index data array
            let _aIndexData = this._indexdata[_nCtr - 1];

            // initialise it so that the index has at least one null entry even if table has no records 
            // recno:1 corresponds to how it is assigned on a new table
            _aIndexData[0] = { indexval: "", recno: 1 };

            let thisrecord = {}; // object to temporarily hold current record 

            // scan the data table and update {indexval: , recno: } for each record
            let _uIndexVal = "";
            let _nRecCtr = 0;
            for (_nRecCtr = 1; _nRecCtr <= this._reccount; _nRecCtr++) {
                // create temporary thisrecord object, so that we can evaluate index expression in context of thisrecord 
                thisrecord = this._table[_nRecCtr - 1];

                // _uIndexVal = eval(_cIndexKeyExp);
                _uIndexVal = _fIndexEvalFx(thisrecord);
                
                // For char string, mysql comparision is case-in-sensitive
                // so, we want to emulate that here too
                // we do it by using two things :
                // 1) Firstly, we store all string keys in upper case in Index Table
                // 2) Then, during binary search on Index Table, we will convert the value being seeked to uppercase 
                if (typeof _uIndexVal == "string") {
                    _uIndexVal = _uIndexVal.toUpperCase();
                }

                _aIndexData[_nRecCtr - 1] = { indexval: _uIndexVal, recno: _nRecCtr };
            }

            // Now, sort the data on indexval
            _aIndexData.sort(function (a, b) {
                // return a.indexval > b.indexval ? 1 : -1;
                return a.indexval > b.indexval ? 1 : a.indexval < b.indexval ? -1 : a.recno < b.recno ? -1 : 1 ;
            });

        } // endfor outer

        return true;
    };

    /**
     * This method deletes all indexes on the Local Table.
     * 
     * @returns {boolean} This method always returns true.
     * 
     * @example
     * // delete all indexes
     * let _lResult = mytable.deleteIndexes();  
     */
    LocalTable.prototype.deleteIndexes = function () {
        this._curorder = 0;        // current index order 
        this._indexcount = 0;      // Total Indexes defined on this table
        this._indexdef = [];       // array of index definition objects of form {indexkeyexp:"somekeyexp"}  
        this._indexdata = [];      // array of all index tables - each index table in turn is an array of {indexval: "somevalue", recno: actual_record_no } 
        return true;
    }

    /**
     * This method allows us to append another table into this Local Table.
     *  
     * @param {object} srctableObj The source table whose records we want to append
     * to this local table.
     * 
     * @returns {boolean} This method always returns true.
     * 
     * @example
     * // append data from another table
     * let _aTableStruct = mytable.structdef();  // assigns the data structure to the variable
     * let newtable = new LocalTable(_aTableStruct); // creates a new table
     * newtable.appendFromTable(mytable) ;   // append data in newtable from mytable
     * 
     */
    LocalTable.prototype.appendFromTable = function (srctableObj) {

        // first commit current data
        // update indexes also as we are going to move record pointer 
        this.commit();

        // current record count()
        let _nNewCnt = this._reccount;

        // force commit on source table (in case there are any records which are not committed) 
        srctableObj.commit(); 

        // Now append records from srcTableObj into this table
        let thisrecord = {};     // object to temporarily hold one record of source table

        let _nRecCtr = 0;
        for (_nRecCtr = 1; _nRecCtr <= srctableObj._reccount; _nRecCtr++) {
            if (srctableObj._table[_nRecCtr - 1]._deleted == true) {
                // this record is a deleted record , so skip it
                continue;
            }

            // create temporary thisrecord object 
            thisrecord = srctableObj._table[_nRecCtr - 1];

            // append the record into this table
            _nNewCnt++;
            this._table[_nNewCnt - 1] =  JSON.parse(JSON.stringify(thisrecord)); // thisrecord;
        }

        // set reccount
        this._reccount = _nNewCnt;


        // Before reindexing, Go to 1st physical  record of Table, but do not do 
        // commit again. This will bring the data from table array[1] to current
        // record, which might otherwise would have been empty. That would have  
        // let reindex to commit the empty current record and that would
        // have been wrong 
        if (this._reccount > 0) {
            this.goTo(1, true);
        }

        // reindex
        this.reindex();

        // Now, go to last physical record added (do not use current index). Also, do not do commit again
        if (this._reccount > 0) {
            this.goTo(this._reccount, true) ;
        } 
        
        return true;
    };



    /**
     * It gets the bookmark or the current record number in the specified local table.
     *
     * @returns {number} It returns a numeric value _nBookMark, which specifies
     * the bookmark or the current record number.
     * It returns 0 if the current record pointer is at the end of the file.
     * It returns -1 if the current record pointer is at the beginning of the file.
     * 
     * @example
     * mytable.goTo(3) ;
     * let _nBookMark = mytable.xbGetBookMark() ;     // returns : 3  
     *   
     * mytable.goBottom() ;
     * mytable.skip() ;
     * let _nBookMark = mytable.xbGetBookMark() ;     // returns : 0
     * 
     * mytable.goTop() ;
     * mytable.skip(-1) ;
     * let _nBookMark = mytable.xbGetBookMark()       // returns : -1
     * 
     */

    LocalTable.prototype.xbGetBookMark = function () {

        let _nBookMark = 0 ;

        if (this.bof()) {
            _nBookMark = -1 ;
        } else if (this.eof()) {
            _nBookMark = 0 ;
        } else {
            _nBookMark = this.recno() ;       
        }       
    
        return _nBookMark ;

    } ;


    /**
     * This method will set the current record pointer to the specified bookmark
     * in the local table.
     * 
     * @param {number} _nBookMark is a numeric value which specifies the bookmark 
     * of the table, which was obtained by using xbGetBookMark() method.
     * 
     * @returns {boolean} The method returns a logical value signifying the result
     * of the method. 
     * The value can be true if the method is executed successfully. 
     * It can be false if the method did not execute successfully due to either of the following errors :
     * 1) The parameter is not passed or not of numeric data type.
     * 2) The specified bookmark is not in the range [-1, number of records in the table].
     *
     * @example
     * mytable.xbGoToBookMark(5) ;    // returns : true
     * mytable.recno() ;              // returns : 5
     *
     * mytable.xbGoToBookMark(-1) ;   // returns : true
     * mytable.bof() ;                // returns : true
     * mytable.eof() ;                // returns : false
     *
     * mytable.xbGoToBookMark(0) ;    // returns : true 
     * mytable.eof() ;                // returns : true 
     * mytable.bof() ;                // returns : false
     * 
     */

    LocalTable.prototype.xbGoToBookMark = function (_nBookMark) {

        if (typeof _nBookMark != "number") {
            console.debug("xbGoToBookMark - invalid parameter value") ;
            return false ;
        }

        let _lSuccess = true ;
        switch (_nBookMark) {
            case -1 :
                this.goTop() ;              // here we will commit.
                if (! this.bof()) {
                    this.skip(-1,true) ;    // here we need not commit again.
                    break ;
                }

            case 0 :
                this.goBottom() ;           // here we will commit.
                if (! this.eof()) {
                    this.skip(1, true) ;     // here we we need not commit again.
                    break ;
                }

            default :
                if (this.recno() != _nBookMark) {
                    if (_nBookMark >= 1 && _nBookMark  <= this.reccount()) {
                        this.goTo(_nBookMark) ;
                    } else {
                        _lSuccess = false ; 
                        this.goTop() ;
                    }  
                }
        }

        return _lSuccess ;

    } ;


    /**
     * This method will convert a field, which is an existing object to another object layout, 
     * which has either a subset of properties in the specified field or has some additional
     * properties. 
     * 
     * @param {string} _cFieldName is a character string which specifies the field name of
     * the field in the local table.
     * 
     * @param {object} _oObjTemplate is an object template, which is an object with name value pairs.
     * The values in an object template are empty values of corresponding data type.
     * 
     * @returns {boolean} The method returns true. 
     * 
     * @example
     * mytable.setObjectTemplate("mycircle", { point: { x: 1, y: 2 }, r: 10 });
     * 
     */

    LocalTable.prototype.setObjectTemplate = function (_cFieldName,_oObjTemplate) {
        _cFieldName = _cFieldName.trim();

        let _aStruct = this._astructdef;
        let _nStruLen = _aStruct.length;
        let _oFldStru = {};
        let _cPropId = "";
    
        let _nCtr = 0;
        for (_nCtr = 0; _nCtr <= _nStruLen - 1; _nCtr++) {
            _oFldStru = _aStruct[_nCtr];

            // An individual element of the structure definition array (_aStruct) specifies  
            // one field. example : _oFldStru = {fieldname:"itemcd",datatype:"C",len:15,dec:0}

            // The len and dec properties are primarily used for indexing in proper manner, as
            // json is free-format, it has no direct use in data structure
            // 
            // An actual empty _orgstruct should be like : {itemcd:"",qty:0,mydate:"0000-00-00",isregd:false,itemdes:""}

            // The stucture can also specify objects in two different forms :
            // 1. Object Literals such as :  
            //    {fieldname:"userinfo",datatype:"O",len:10,dec:0,objtemplate:{address:{line1:"",line2:"",city:""},regno:"",spllimit:0,allowdisc:false}},
            // 2. Object Class such as : 
            //    {fieldname:"mycircle",datatype:"O",len:10,dec:0,objclassname:"Circle"},


            _cPropId = _oFldStru.fieldname.trim();
            
            if (_cPropId == _cFieldName) {
                _oFldStru.datatype = "O";
                _oFldStru.len = 10; 
                _oFldStru.dec = 0 ;
                _oFldStru.objtemplate = JSON.parse(JSON.stringify(_oObjTemplate));
                break;
            }    

        } // end for

        // call modistru
        this.modiStru(_aStruct) ;


        // convert JSON to object in each record
        // Let's first go to 1st physical record (as we are not traversing using index)
        this.goTo(1); 
        if (this.eof() == false) {
            // scan in forward direction
            let _nRecCtr = 0;
            for (_nRecCtr = this._recno; _nRecCtr <= this._reccount; _nRecCtr++) {
                // blank object template
                let tgtobject = JSON.parse(JSON.stringify(this._struct[_cFieldName])); 
                
                // source JSON or null string
                let srcobject = this._table[_nRecCtr - 1][_cFieldName] ;

                // copy over
                mylib.deepObjUpdProperties(tgtobject, srcobject) ;

                // update back on the object field of the record
                this._table[_nRecCtr - 1][_cFieldName] = tgtobject;
            } // end for

            this.goTo(1); 

        } else {
            // eof on goto(1) - nothing to replace 
        }

        return true;

    };


    /**
     * This method will convert a field, which is an existing object to another object 
     * of the specified class.   
     * 
     * @param {string} _cFieldName is a character string which specifies the field name of
     * the field in the local table.
     * 
     * @param {string} _cObjClassName is a character string which specifies the class name of
     * the field in the local table.
     * 
     * @returns {boolean} The method returns true. 
     * 
     * @example
     *   mytable.setObjectClassName("mycircle", "appClasses.Circle");
     * 
     */

    LocalTable.prototype.setObjectClassName = function (_cFieldName,_cObjClassName){
        _cFieldName =  _cFieldName.trim();

        let _aStruct = this._astructdef;
        let _nStruLen = _aStruct.length;
        let _oFldStru = {};
        let _cPropId = "";
    
        let _nCtr = 0;
        for (_nCtr = 0; _nCtr <= _nStruLen - 1; _nCtr++) {
            _oFldStru = _aStruct[_nCtr];

            // An individual element of the structure definition array (_aStruct) specifies  
            // one field. example : _oFldStru = {fieldname:"itemcd",datatype:"C",len:15,dec:0}

            // The len and dec properties are primarily used for indexing in proper manner, as
            // json is free-format, it has no direct use in data structure
            // 
            // An actual empty _orgstruct should be like : {itemcd:"",qty:0,mydate:"0000-00-00",isregd:false,itemdes:""}

            // The stucture can also specify objects in two different forms :
            // 1. Object Literals such as :  
            //    {fieldname:"userinfo",datatype:"O",len:10,dec:0,objtemplate:{address:{line1:"",line2:"",city:""},regno:"",spllimit:0,allowdisc:false}},
            // 2. Object Class such as : 
            //    {fieldname:"mycircle",datatype:"O",len:10,dec:0,objclassname:"Circle"},

            _cPropId = _oFldStru.fieldname.trim();
            
            if (_cPropId == _cFieldName) {
                _oFldStru.datatype = "O";
                _oFldStru.len = 10; 
                _oFldStru.dec = 0 ;
                delete _oFldStru.objtemplate ;
                _oFldStru.objclassname = _cObjClassName;
                break;
            }    

        } // end for

        // call modistru
        this.modiStru(_aStruct) ;

        // convert JSON to object in each record
        // Let's first go to 1st physical record (as we are not traversing using index)
        this.goTo(1); 
        if (this.eof() == false) {
            // scan in forward direction
            let _nRecCtr = 0;
            for (_nRecCtr = this._recno; _nRecCtr <= this._reccount; _nRecCtr++) {
                // blank object template
                let tgtobject = JSON.parse(JSON.stringify(this._struct[_cFieldName])); 
                
                // source JSON or null string
                let srcobject = this._table[_nRecCtr - 1][_cFieldName] ;

                // copy over
                mylib.deepObjUpdProperties(tgtobject, srcobject) ;

                // update back on the object field of the record
                this._table[_nRecCtr - 1][_cFieldName] = tgtobject;
            } // end for

            this.goTo(1); 

        } else {
            // eof on goto(1) - nothing to replace 
        }

        return true;

    };



    //synonym methods (all lowercase)- to mitigate risk of wrong invocation  
    LocalTable.prototype.modistru = LocalTable.prototype.modiStru;
    LocalTable.prototype.appendblank = LocalTable.prototype.appendBlank;
    LocalTable.prototype.getemptyrecord = LocalTable.prototype.getEmptyRecord;
    LocalTable.prototype.replacewith = LocalTable.prototype.replaceWith;
    LocalTable.prototype.replaceinto = LocalTable.prototype.replaceInto;
    LocalTable.prototype.insertinto = LocalTable.prototype.insertInto;
    LocalTable.prototype.setdeletedon = LocalTable.prototype.setDeletedOn ;
    LocalTable.prototype.setdeletedoff = LocalTable.prototype.setDeletedOff ;
    LocalTable.prototype.setfilter = LocalTable.prototype.setFilter ;
    LocalTable.prototype.clearfilter = LocalTable.prototype.clearFilter ;
    LocalTable.prototype.replaceall = LocalTable.prototype.replaceAll ;
    LocalTable.prototype.deleteall = LocalTable.prototype.deleteAll ;
    LocalTable.prototype.recallall = LocalTable.prototype.recallAll ;
    LocalTable.prototype.goto = LocalTable.prototype.goTo ;
    LocalTable.prototype.gotop = LocalTable.prototype.goTop ;
    LocalTable.prototype.gobottom = LocalTable.prototype.goBottom ;
    LocalTable.prototype.indexon = LocalTable.prototype.indexOn ;
    LocalTable.prototype.bldindexexp = LocalTable.prototype.bldIndexExp ;
    LocalTable.prototype.bldvalueexp = LocalTable.prototype.bldValueExp ;
    LocalTable.prototype.setorder = LocalTable.prototype.setOrder ;
    LocalTable.prototype.curorder = LocalTable.prototype.curOrder ;
    LocalTable.prototype.setcurindex = LocalTable.prototype.setCurIndex ;
    LocalTable.prototype.deleteindexes = LocalTable.prototype.deleteIndexes ;
    LocalTable.prototype.appendfromtable = LocalTable.prototype.appendFromTable ;
    LocalTable.prototype.xbgetbookmark = LocalTable.prototype.xbGetBookMark ;
    LocalTable.prototype.xbgotobookmark = LocalTable.prototype.xbGoToBookMark ;
    LocalTable.prototype.setobjecttemplate = LocalTable.prototype.setObjectTemplate ;
    LocalTable.prototype.setobjectclassname = LocalTable.prototype.setObjectClassName ;

    Object.freeze(LocalTable.prototype);


    //export Class
    //if (typeof global == "object") {
    //    //we are in nodejs/vscode environment, so export the module
    //    module.exports = { LocalTable: LocalTable };
    //}

    // expose our constructor to the global object
    context.LocalTable = LocalTable;
    
})( this );