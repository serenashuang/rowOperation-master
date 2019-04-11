$(function() {
    
    $('#form-horizontal-feedBack').bootstrapValidator({
        message: 'This value is not valid',
        feedbackIcons: {
            valid: 'glyphicon glyphicon-ok',
            invalid: 'glyphicon glyphicon-remove',
            validating: 'glyphicon glyphicon-refresh'
        },
        fields: {
            comment: {
                validators: {
                    notEmpty: {
                        message: 'comment cannot be empty'
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

function clickComment() {

    var modalComment = $("#modalComment");
    var emailComment = $("#emailComment");
    if (modalComment.val() == "" || emailComment.val() == "") {

    } else {
        $.post("/judge/oneteam_robot_comment", {
                modalComment: modalComment.val(),
                emailComment: emailComment.val(),

            },
            function(data) {
               
                if (data.status == 1) {

                 modalComment.val("");
                 emailComment.val("");
                 location.reload();
                 $("#modalFeedBack").modal('toggle');
                } else {
                    alert("wrong");
                }
            });
    }


}
