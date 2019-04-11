$(function () {
        $('#form-horizontal-email').bootstrapValidator({
            message: 'This value is not valid',
            feedbackIcons: {
                valid: 'glyphicon glyphicon-ok',
                invalid: 'glyphicon glyphicon-remove',
                validating: 'glyphicon glyphicon-refresh'
            },
            fields: {
                emailContent: {
                    validators: {
                        notEmpty: {
                            message: 'content cannot be empty'
                        }
                    }
                },
                subject: {
                    validators: {
                        notEmpty: {
                            message: 'subject cannot be empty'
                        }
                    }
                },
                guild: {
                validators: {
                    notEmpty: {
                        message: 'guild cannot be empty'
                        }
                    }
                },
                email: {
                    validators: {
                        notEmpty: {
                            message: 'email connt be empty'
                        },
                        emailAddress: {
                            message: 'email format is incorrect'
                        }
                    }
                }
            }
        });
    });

function clickEmail() {

    var emailto = $("#emailto");
    var EmailSubject = $("#EmailSubject");
    var EmailContent = $("#EmailContent");
    var postData = {"mailSender":emailto.val(),"mailReciver":"kongyh@cn.ibm.com","mailSubject":"(askWatson) "+EmailSubject.val(),"mailContent":EmailContent.val()};

    if (emailto.val() == "" || EmailSubject.val() == "" || EmailContent=="") {

    } else {
      
        $.post("api/sendEmail", postData,
            function(data) {
               console.log("email module in:");
               console.log(data);
                if (data == 201) {

                    emailto.val("");
                    EmailSubject.attr("value","");
                    $('#EmailGuild').attr("value","");
                    EmailContent.val("");

                    $('#emailto').removeClass('has-feedback has-success');
                    $('#EmailSubject').removeClass('has-feedback has-success');
                    $('#EmailGuild').removeClass('has-feedback has-success');
                    $('#EmailContent').removeClass('has-feedback has-success');
                    $('.form-group').removeClass('has-feedback has-success');
                    $('.glyphicon-ok').removeClass('glyphicon-ok');

                    $('button').removeAttr('disabled');

                    $("#modalQuestion").modal('toggle');
                    
                    $.alert({
                        title: 'Successfully!',
                        content: 'Email Sent!',
                    });
                } else {
                    alert("wrong");
                }
            });
    }


}