var _ = require('lodash'),
    fs = require('fs'),
    Cards = [],
    cardUsed = [],
    eventUsed = [],
    debug = [];


var skills = JSON.parse(fs.readFileSync('DOWNLOAD.json', 'utf8'))["skill cards"];
_.map(skills, function(s) { s.kind = "skill"; });
var exceptions = JSON.parse(fs.readFileSync('DOWNLOAD.json', 'utf8'))["Events card"];
_.map(exceptions, function(e) { e.kind = "exception"; });
var attacks = JSON.parse(fs.readFileSync('DOWNLOAD.json', 'utf8'))["Attacks (fluff)"];
_.map(attacks, function(a) { a.kind = "attack"; });


var pickFirst = function() {
    var mIndex;
    _.each(skills, function(elem, i) {
        if (elem == undefined) {}
        else if (_.endsWith(elem.cid, '12')) {}
        else if (_.endsWith(elem.cid, '13')) {}
        else if (_.endsWith(elem.cid, '14')) {}
        else if (mIndex != undefined) {}
        else {
            mIndex = i;
        }
    });
    if (mIndex == undefined) {
        console.log("BAD - first skills missing ");
        debugger;
        console.log(cardUsed);
    }
    var retVal = _.get(skills, mIndex);
    cardUsed.push(retVal.cid);
    delete skills[mIndex];
    return retVal;
};

var pickException = function(eId) {
    var mIndex;
    _.each(exceptions, function(elem, i) {
        if (elem == undefined) {}
        else if (elem.eid == eId) {
            mIndex = i;
        }
    });
    if (mIndex == undefined) {
        console.log("BAD - exception missing " + eId);
        debugger;
        console.log(eventUsed);
    }
    var retVal = _.get(exceptions, mIndex);
    eventUsed.push(retVal.eid);
    delete exceptions[mIndex];
    return retVal;
};

var pickPrecise = function(aimId)
{
    var mIndex;
    _.each(skills, function(elem, i) {
        if (elem == undefined) {}
        else if (elem.cid == aimId ) {
            mIndex = i;
        }
    });
    if (mIndex == undefined) {
        console.log("BAD - skills missing " + aimId);
        debugger;
        console.log(cardUsed);
    }
    var retVal = _.get(skills, mIndex);
    cardUsed.push(retVal.cid);
    delete skills[mIndex];
    return retVal;
};

var pickRange = function(smaId, bigId) {
    var mIndex;
    _.each(skills, function(elem, i) {
        if (elem == undefined) {}
        else if (mIndex != undefined ) {}
        else if (elem.cid >= smaId && elem.cid <= bigId) {
            mIndex = i;
        }
    });
    if (mIndex == undefined) {
        console.log("BAD - missing range " + smaId + " <> " + bigId);
        debugger;
        console.log(cardUsed);
    }
    var retVal = _.get(skills, mIndex);
    console.log("\tRange min " + smaId + " big " + bigId + " = match with " + retVal.cid);
    cardUsed.push(retVal.cid);
    delete skills[mIndex];
    return retVal;
};

var suiteMap = { 1 : 3, 2 : 4, 3 : 2, 4 : 1 };
var SuiteToNumber = { outreach: 1, opsec: 2, hacking: 3, anonymity: 4 };

var pickBasedOn = function(skillCardId) {

    var srcCardSuite = Math.floor(skillCardId / 100);
    var _x = ( skillCardId - (srcCardSuite * 100) );
    if (_x > 30 ) {
        var srcCardTier = 3;
        var srcCardUniq = (skillCardId % 100) - (srcCardTier * 10);
    } else if (_x > 20) {
        var srcCardTier = 2;
        var srcCardUniq = (skillCardId % 100) - (srcCardTier * 10);
    } else {
        var srcCardTier = 1;
        var srcCardUniq = (skillCardId % 100);
    }

    console.log("Skill card id " + skillCardId +
        "= Tier " + srcCardTier + " Suite " + srcCardSuite + " Uniq " + srcCardUniq
        + " Skills:" + skills.length + " Exceptions:" + exceptions.length);

    /* The three(s) goes with the first One */
    if (srcCardTier == 3 && srcCardUniq == 2) {
        return pickPrecise( (suiteMap[srcCardSuite] * 100) + 12 );
    }
    /* The three(s) goes also with the powerful Exception(s) */
    else if (srcCardTier == 3 && srcCardUniq == 1) {
        return pickException(3000 + srcCardSuite);
    }
    /* first two TWOs are associated to exceptions, other to ONEs */
    else if (srcCardTier == 2 && srcCardUniq <= 2) {
        return pickException (2000 + ((srcCardSuite -1) * 2) + srcCardUniq );
    }
    /* the 13 and 14 */
    else if (srcCardTier == 2 && srcCardUniq >= 3) {
        var _x = (suiteMap[srcCardSuite] * 100) + 10;
        return pickRange(
            _x + 3,
            _x + 4
        );
    }
    /* the one 4-11 takes other ONEs */
    else if (srcCardTier == 1 && srcCardUniq >= 4 && srcCardUniq <= 11) {
        return pickRange(
            (suiteMap[srcCardSuite] * 100) + 4,
            (suiteMap[srcCardSuite] * 100) + 11
        )
    }
    /* the one 1,2,3 takes exceptions tier one */
    else if (srcCardTier == 1 && srcCardUniq <= 3) {
        return pickException( (1000 + ((srcCardSuite -1) * 3) + srcCardUniq ) );
    }
};


for(var i = 1; i <= 52; i++) {
    var newCard = {};
    newCard.card_id = i;
    newCard.top = pickFirst();
    newCard.down = pickBasedOn(newCard.top.cid);
    if (newCard.down.kind == 'exception') {
        debug.push([newCard.top.cid, newCard.down.eid ]);
    } else {
        debug.push([newCard.top.cid, newCard.down.cid ]);
    }
    Cards.push(newCard);
    console.log("Done: " + _.last(debug));
}

fs.writeFileSync('GENERATED_DECK.json', JSON.stringify(Cards, undefined, 2));
fs.writeFileSync('GENERATED_ATTACK.json', JSON.stringify(attacks, undefined, 2));

console.log("Ok, done");
