var jsonDevices;
const URL = "https://moaci-backend.herokuapp.com/alexa/user_524347ed-8312-4ee7-98dd-5aedc292c485/home_appliances/connected";

function getDevicesConnected() {

    axios.get(URL)
    .then(function(response){
        jsonDevices = response.data.home_appliances;
        
        console.log(response.data);
        console.log(response.status);

        loadDevicesStatus(jsonDevices);

    });  

    $.ajax({
        url: URL,
        type: 'GET',
        success: function(res) {
            jsonDevices = res.home_appliances;
            console.log(jsonDevices);
        }
    });
}

function changeDeviceStatus(id, device, power) {
    var json = jsonDevices;
    changeStatus(id, device, power, json);
    console.log(json);


    axios.post(URL, { home_appliances: json })
    .then(function(res){
        if (res.data.message == 'Consumo atualizado') {
            jsonDevices = json;
        } else {
            alert("erro ao atualizar. Tente novamente!");
        }

        console.log(jsonDevices);
    });
}

function changeStatus(id, device, power, array) {
    var needToAdd = true;
    if (array != null) {
        for (var x = 0; x < array.length; x++) {
            if (array[x].device == device) {
                array.splice(x, 1);
                needToAdd = false;
                $(`#${id}`).removeClass('btn btn-success').addClass('btn btn-danger');
                $(`#${id}`).text('Desligado');
                break;
            }
        }
    }
    if (needToAdd == true) {
        array.push({
            device: device,
            power: power
        })
        $(`#${id}`).removeClass('btn btn-danger').addClass('btn btn-success');
        $(`#${id}`).text('Ligado');
    }
    console.log(`#${id}`);
}

function loadDevicesStatus(array) {
    for (var x = 0; x < array.length; x++) {
        if (array[x].device == "tv") {
            $(`#btnTv`).removeClass('btn btn-danger').addClass('btn btn-success');
            $(`#btnTv`).text('Ligado');
        } else if (array[x].device == "geladeira") {
            $(`#btnRefrigerator`).removeClass('btn btn-danger').addClass('btn btn-success');
            $(`#btnRefrigerator`).text('Ligado');
        } else if (array[x].device == "abajur") {
            $(`#btnLamp`).removeClass('btn btn-danger').addClass('btn btn-success');
            $(`#btnLamp`).text('Ligado');
        } else if (array[x].device == "microondas") {
            $(`#btnMicrowave`).removeClass('btn btn-danger').addClass('btn btn-success');
            $(`#btnMicrowave`).text('Ligado');
        } else if (array[x].device == "ferro de passar roupa") {
            $(`#btnIron`).removeClass('btn btn-danger').addClass('btn btn-success');
            $(`#btnIron`).text('Ligado');
        } else if (array[x].device == "liquidificador") {
            $(`#btnBlender`).removeClass('btn btn-danger').addClass('btn btn-success');
            $(`#btnBlender`).text('Ligado');
        } 
    }
}

getDevicesConnected();