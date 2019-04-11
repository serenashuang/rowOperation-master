$(".slidemid").mouseenter(

    function() {
        $(".slidemid").css("display", "none")
        $(".btn-info").show("slow");
        $(".btn-default").show("slow");
    })

$("#scrollingChat").mouseenter(

    function() {

        $(".btn-info").hide("slow");
        $(".btn-default").hide("slow");
        $(".slidemid").show("slow")
    })
