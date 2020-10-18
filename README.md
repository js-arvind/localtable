
      The Covid-19 pandemic has taught us many things. One among that is we should share our knowledge with the world 
      rather than it just being lost some day.


      This repo contains a LocalTable Class for javascript which enables us to create a flexible, powerful and versatile mechanism 
      for in-memory local tables.

      I would love everyone to use it, play with it and provide feedback.

 
      Summary :

      We can define and open one or many local tables. We can create a table by calling the
      constructor of LocalTable Class with a data structure definition array _aStruct. It is
      an array of JSON tuples, where each tuple describes the structure of one column of the
      local table. For example: 
      [{fieldname:"itemcd",datatype:"C",len:15,dec:0}, {fieldname:"itemname",datatype:"C",len:50,dec:0}]
      The constructor creates a table object which has zero records. We can assign this 
      table object to any variable, which is then synonymous with the given table. 
      
      The allowed datatypes are : 
       1. C - for small Character String (upto 254 chars)
       2. M - for large Character String ( > 254 chars)
       3. G - for General Fields, which stores any arbitrary data as Utf-8 String
       4. N - for numbers
       5. D - for dates
       6. L - for Logical (boolean)
       7. O - for Objects
         
       The objects can be specified in two different forms :
         1. Object Literals such as :  
            {fieldname:"userinfo",datatype:"O",len:10,dec:0,objtemplate:{address:{line1:"",line2:"",city:""},regno:"",spllimit:0,llowdisc:false}}
         2.Object Class such as : 
           {fieldname:"mycircle",datatype:"O",len:10,dec:0,objclassname:"Circle"}
          We can also update the data structure (schema) of a table by using method
          modiStru(_aStruct).
     
      We can append a blank record in the table by calling method appendBlank() and then
      simply update the columns by assigning values to them. These updated record columns can
      be read immediately and used in any expression.
      
      We can get an empty record object representing the structure of a record of the table wherein
      the various fields are initialised to an empty value for the corresponding datatype of each 
      field by calling the getEmptyRecord() method.
      
      Any operation which moves the record pointer in the local table will commit the data to the 
      local table automatically, but if we assign values to the fields of the current record and want 
      the values to be committed immediately, we can use the commit() method which commits previously 
      current record of the local table. Normally, in application, we do not need to call commit explicitly,
      as various methods on localtable automatically call this method internally. It may be needed only
      in very special cases. 
      
      We can also replace (update) data in several columns by methods such as replacewith(replaceList) and 
      replaceInto({prop1: value1, prop2: value2}). 
     
      We can add a new record and as well as update multiple columns in the new record by 
      method insertInto({prop1: value1, prop2: value2}). 
       
      We refer to columns (fields) of current record by simply referring to them as
      tablename.colname.  
      
      A table always has a current record, which can be queried using the method recno(). 
      A table can have any number of records, which can be queried by method reccount().
      
      We can delete a current record by method delete(). It logically deletes the record
      by marking it as deleted. However, the record still exists in the table. We can test if
      a current record is deleted by using method deleted() - which will return true or false.
      We can un-delete or recall a current record which is deleted using recall().
        
      We can navigate the table by using methods such as goTo(recordNumber), goTop(),
      goBottom(), skip(numberOfRecs), locate(conditionExpr) etc.
      
      A table has several state attributes which can be queried by methods such as : 
      bof() - is it beginning of File/Table ? 
      eof() - is it end of File/Table ? 
      
      We can determine if a record was found or not after a navigation operation such as seek, skip, 
      locate etc. by using the method found().
      
      Normally, when we navigate a table using any of the above mentioned navigation methods
      such as skip(_nRecs), goTop(), goBottom(), locate(conditionExpr) etc. except
      goTo(recnumber), the deleted records will be skipped. However, if we do not wish
      to skip these deleted records, then we can set a property setdeleted to false by using
      method setDeletedOff(). We can reset it back to true by using method setDeletedOn().
      We can query the state of this property by using the method setdeleted(). 
     
      We can also apply a filter condition on a table by using method setFilter(filterConditionExpr). 
      When we set a filter on a table, all navigation operations except goTo(recordNumber) will
      respect the filter condition. We can clear the filter using method clearFilter(). We can find 
      the current filter condition by using method filter().
      
      We can update data in several records which satisfy a given condition by method
      replaceAll(replaceList, separator, conditionExpr). We can also delete several records 
      which satisfy a given condition by using method deleteAll(conditionExpr). We can also
      recall several records which satisfy a given condition using method 
      recallAll(conditionExpr).
      
      We can permanently remove all deleted records from the table by using method pack().
      Moreover, we can permanently delete all records in a table by using method zap(). 
        
      A table can optionally have one or more indexes. The indexes can be created by using 
      method indexOn(keyList). The indexes are updated whenever any method moves the current
      record pointer, thereby commiting the current record. A table always has a current 
      index order, which may be zero (implying no current index) or a number n which
      corresponds to the nth index.  We can navigate the table either in physical sequence or
      in indexed sequence depending on whether a current index has been set to zero or n. 
      When we index a table, the current index is set to that index. We can also change the 
      current index using method setOrder(indexNumber). We can find current index sequence or 
      order by using method curOrder(). We can also re-create all indexes using the method
      reindex(). The primary use of the index is to seek a record using the index by 
      method seek(keyValue) - this performs a binary search on the index and quickly finds
      the record which matches the specified keyValue. The Index keys can be either single
      column or multi-columns, whose data-type is Character, Numeric or Date.       
      
      An Index can have one or more keys - which may be of different data types. For a multi key
      index, it is neccessary to build composite index keys in an appropriate fashion with 
      appropriate padding and data type conversion - so that the index keys are built in an uniform
      fashion for all records. The method bldIndexExp() is used to return an index expression, 
      which can be evaluated for each record in a table to build the actual index. This method is
      used internally by indexOn() method. It is also used by LocalSql library.
      
      Similary, while seeking a record on multi key index, it is necessary to build the key value 
      string in an appropriate fashion, so that we can search for the given key value string in the
      index file. The method bldValueExp() is used to return a key value expression, which can be 
      evaluated for given values of the keys to get a composite keyvalue string. 
      
      There are several other methods related to indexes such as indexKeyList(indexNumber), 
      setCurIndex(keyList), indexcount(), deleteIndexes() etc.
      We can use the method indexKeyList(indexNumber) to return the Index Keys list for the specified 
      index sequence. We can set the current index to an index whose keys correspond to the specified 
      keys list using the method setCurIndex(keyList). indexcount() can be used to find total number 
      of indexes defined on the local table and the method deleteindexes() will delete all indexes on 
      the local table.
      
      We can navigate a table in indexed sequence rather than physical sequence by selecting an index 
      sequence using setOrder(indexNumber) or setCurIndex(keyList) and then using methods such as skip(), 
      locate(), goTop(), goBottom() etc.
       
      We can also append another table into an existing local table using appendFromTable().
      xbGetBookMark() and xbGoToBookMark() are methods used to get the current record number and set
      the pointer to the specified record number in the specified local table respectively. 
      
      The method setObjectTemplate() will convert a field, which is an existing object, to another 
      object layout which has either a subset of properties in the specified field or has some 
      additional properties. setObjectClassName() method will convert a field, which is an existing 
      object to another object of the specified class.
        
      There are detailed examples in the source code.  