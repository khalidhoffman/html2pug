const chai = require('chai');

const php2pug = require('../lib');

const expect = chai.expect;

describe("php2pug", function () {

    it("can convert php to pug", function () {
        const sampleText = "<div><?php echo 'Hello World'; ?></div>";

        return php2pug(sampleText, {useLib: false})
            .then(function (pugText) {
                expect(pugText).to.eql(`div !{"<?php echo 'Hello World';  ?>"}`);
            });
    });
})
