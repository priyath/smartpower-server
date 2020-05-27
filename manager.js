const  { orderBy } = require('lodash');
const WEEK_SECONDS = 604800;

const getStartEndTimestampForMonth = (year, month) => {
    const lastMonth = parseInt(month) + 1;
    const date = new Date(year, month, 1);
    const lastDate = new Date(year, lastMonth, 1);
    return {firstTimestamp: date.getTime()/1000, lastTimestamp: lastDate.getTime()/1000};
}

const getDatasetByDate = (records, date) => {
    if (records && records.length > 0) {
        return records.filter(record => {
            return record.date === date;
        })
    } else {
        return []
    }
}

const getBlockForTimestamp = (timestamp, periodBlocks) => {
    const blocks = periodBlocks.filter((block) => {
        return timestamp >= block.startTime && timestamp < block.endTime;
    });
    return blocks[0];
}

const isSamePeriodBlock = (t1, t2, period) => {
    const t1Block = getBlockForTimestamp(t1, period).blockNumber;
    const t2Block = getBlockForTimestamp(t2, period).blockNumber;

    return t1Block === t2Block;
}

const getBlockByBlockNumber = (periodBlocks, blockNumber) => {
    const blocks = periodBlocks.filter((block) => {
        return block.blockNumber === blockNumber;
    });
    return blocks[0];
}

const isTimestampInBlock = (timestamp, block) => {
    return timestamp >= block.startTime && timestamp < block.endTime;
}

const getBlocks = (currTime, nextTime, periodTimestamps, avgPower) => {
    let blocks = []

    let terminate = false;
    let startTime = currTime;

    while (!terminate) {
        let block = getBlockForTimestamp(startTime, periodTimestamps);
        let endTime = block.endTime;

        if (isTimestampInBlock(nextTime, block)){
            endTime = nextTime;
            terminate = true;
        }

        blocks.push({
            startTime: startTime,
            endTime: endTime,
            power: avgPower,
            blockNumber: block.blockNumber,
            energy: getEnergy(startTime, endTime, avgPower),
        })

        startTime = endTime;
    }
    return blocks;
}

const getEnergy = (startTime, endTime, power) => {
    return (endTime - startTime)*power/(1000*3600);
}


const performEnergyCalculation = (records, periodTimestamps) => {
    return records.reduce((accumulator, record, idx, arr) => {
        if (idx+1 < arr.length) {
            const currTime = record.read_time;
            const nextTime = arr[idx + 1].read_time;

            const currPower = record.power;
            const nextPower = arr[idx + 1].power;
            const avgPower = (currPower + nextPower)/2

            return accumulator.concat(getBlocks(currTime, nextTime, periodTimestamps, avgPower));
        }
        return accumulator;
    }, [])
}

const getTimeBuckets = (granularity, year, month) => {
    let periodBlocks = [];
    if (granularity === 'week'){
        const {firstTimestamp, lastTimestamp} = getStartEndTimestampForMonth(year, month);
        let initialTimestamp = firstTimestamp;

        let endTimestamp;
        let counter = 1;

        let terminate = false;
        while (!terminate){
            endTimestamp = initialTimestamp + WEEK_SECONDS;
            if (endTimestamp >= lastTimestamp){
                endTimestamp = lastTimestamp;
                terminate = true;
            }
            periodBlocks.push({
                startTime: initialTimestamp,
                endTime: endTimestamp,
                blockNumber: counter,
            })
            counter += 1;
            initialTimestamp = initialTimestamp + WEEK_SECONDS;
        }
    }
    return periodBlocks;
}

const splitDate = (dateString) => {
    const splitArr = dateString.split('-');
    return {year: parseInt(splitArr[0]), month:  parseInt(splitArr[1])};
}


const calculateEnergy = (records, granularity, date) => {
    records = orderBy(records, ['read_time']);
    const {year, month} = splitDate(date);
    const timeBuckets = getTimeBuckets(granularity, year, (month-1));
    const recordsWithEnergy = performEnergyCalculation(records, timeBuckets);

    return timeBuckets.map((bucket) => {
        const bucketRecords = recordsWithEnergy.filter((record) => {
            return record.blockNumber === bucket.blockNumber;
        })
        let energyObject = bucketRecords.reduce((acc, record) => {
            acc.totalEnergy = acc.totalEnergy + record.energy;
            acc.recordCount += 1;
            return acc;
        }, {
            totalEnergy: 0,
            recordCount: 0,
        })
        energyObject.bucketNumber = bucket.blockNumber;
        energyObject.startTime = bucket.startTime;
        energyObject.endTime = bucket.endTime;
        return energyObject;
    })
}

const getEnergyBuckets = (records, reqObject) => {
    const fromDate = reqObject.fromDate;
    const toDate = reqObject.toDate;
    const granularity = reqObject.granularity;

    const fromDateEnergyData = calculateEnergy(getDatasetByDate(records, fromDate), granularity, fromDate);
    const toDateEnergyData = calculateEnergy(getDatasetByDate(records, toDate), granularity, toDate);

    return {fromDateEnergyData, toDateEnergyData};

}

module.exports = {
    getEnergyBuckets,
}
