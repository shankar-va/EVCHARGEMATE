const timeslot=(startTime,endTime)=>{
    slots=[];
    let start=parseInt(startTime)
    let end=parseInt(endTime)

    while(start<end){
        slots.push(`${start}:00-${end}:00`);
        start++;
    }
    return slots;

}

module.exports=timeslot